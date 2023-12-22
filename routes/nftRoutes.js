import express from 'express';
import lighthouse from '@lighthouse-web3/sdk';
import { Account, Aptos, AptosConfig, Network, SigningSchemeInput, AccountAddress } from "@aptos-labs/ts-sdk";

const router = express.Router();

router.post('/mint', async (req, res) => {
  const { image_cid, nft_name, nft_description, address } = req.body;

  const metadata = {
    "name": nft_name,
    "description": nft_description,
    "image": `${process.env.LIGHTHOUSE_GATEWAY}/${image_cid}`
  };

  const APTOS_NETWORK = Network.TESTNET;
  const config = new AptosConfig({ network: APTOS_NETWORK });
  const aptos = new Aptos(config);

  try {
    const Blockto = Account.fromDerivationPath({
      path: "m/44'/637'/0'/0'/0'",
      mnemonic: process.env.BLOCKTO_MNEMONIC,
      scheme: SigningSchemeInput.Ed25519,
      legacy: true,
    });
  
    console.log("Blockto Address: ", Blockto.accountAddress.toString());  

    const response = await lighthouse.uploadText(
      JSON.stringify(metadata),
      process.env.LIGHTHOUSE_API_KEY
    );

    const tokenURI = `${process.env.LIGHTHOUSE_GATEWAY}/${response.data.Hash}`;

    const mintTokenTransaction = await aptos.mintDigitalAssetTransaction({
      creator: Blockto,
      collection: "Blockto",
      name: nft_name,
      description: nft_description,
      uri: tokenURI,
    });

    let committedTxn = await aptos.signAndSubmitTransaction({ signer: Blockto, transaction: mintTokenTransaction });
    let pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

    const mintedTxVersion = pendingTxn.version;

    if (pendingTxn.success) {
      const NFTs = await aptos.getOwnedDigitalAssets({
        ownerAddress: Blockto.accountAddress,
        minimumLedgerVersion: BigInt(mintedTxVersion),
      });

      const transferTransaction = await aptos.transferDigitalAssetTransaction({
        sender: Blockto,
        digitalAssetAddress: NFTs[0].token_data_id,
        recipient: AccountAddress.fromString(address),
      });

      committedTxn = await aptos.signAndSubmitTransaction({ signer: Blockto, transaction: transferTransaction });
      pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

      if(pendingTxn.success) {
        console.log("NFT Minted and transferred successfully!");
      } else {
        console.error("Failed during transfer: ", pendingTxn);
        res.status(500).json({ success: false });
      }

    } else {
      console.error("Failed during minting: ", pendingTxn);
      res.status(500).json({ success: false });
    }

    res.status(200).json({ success: true, nft: mintedTxVersion });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Failed to mint NFT');
  }
});

export default router;
