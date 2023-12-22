import express from 'express';
import fetch from 'node-fetch';
import Post from '../models/post.js';
import User from '../models/user.js';
import lighthouse from '@lighthouse-web3/sdk';
import { connectToDB } from '../utils/database.js';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // Limit to 5MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/^image/)) {
      cb(new Error('Only image files are allowed'), false);
    } else {
      cb(null, true);
    }
  }
});

const router = express.Router();

router.get('/:cid', async (req, res) => {
  try {
    await connectToDB();

    const post = await Post.findOne({ cid: req.params.cid }).populate('creator');
    if (!post) return res.status(404).send('Post not found');

    const response = await fetch(`${process.env.LIGHTHOUSE_GATEWAY}/${post.cid}`);
    if (!response.ok) return res.status(500).send('Failed to fetch post data');

    const postData = await response.json();
    if (!postData.files || postData.files.length === 0) {
      return res.status(404).send('No image found for this post');
    }

    const fileCID = postData.files[0].cid;
    res.status(200).json({ cid: fileCID, content: postData.content });
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to fetch post');
  }
});

router.post('/new', async (req, res) => {
  await connectToDB();

  const { postData } = req.body;
  const { content, files, replyingTo, chain, id } = postData;
  console.log(postData);

  if (!postData) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const pinData = {
      content,
      files,
    };

    if (replyingTo) {
      let updatedReplyingTo = [replyingTo];

      const user = await User.findOne({ address: replyingTo.address });
      if (user) {
        replyingTo.username = user.username;

        const response = await fetch(
          `${process.env.PINATA_GATEWAY}/${replyingTo.cid}`
        );
        if (response.ok) {
          const fetchedContent = await response.json();
          if (fetchedContent.replyingTo) {
            updatedReplyingTo = [
              ...updatedReplyingTo,
              ...fetchedContent.replyingTo,
            ];
            updatedReplyingTo = updatedReplyingTo.filter(
              (item, index, self) =>
                index ===
                self.findIndex(
                  (t) => t.cid === item.cid && t.address === item.address
                )
            );
          }
        }
      }
      pinData.replyingTo = updatedReplyingTo;
    }

    const result = await lighthouse.uploadText(
      JSON.stringify(pinData),
      process.env.LIGHTHOUSE_API_KEY
    );

    if (result.data) {
      let postCreationData = {
        creator: id,
        cid: result.data.Hash,
        blockchain: chain
      };
      console.log(postCreationData);

      if (pinData.replyingTo) {
        postCreationData.replyingTo = pinData.replyingTo.map((reply) => ({
          cid: reply.cid,
          address: reply.address,
        }));
      }

      await Post.create(postCreationData);

      res.status(200).json({ success: true, postCreationData });
    } else {
      res.status(500).json({ error: 'Failed to upload to Lighthouse' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const fileType = req.body.fileType;

  if (!file) {
    return res.status(400).json({ error: 'File is required' });
  }

  if (fileType !== 'image') {
    return res.status(400).json({ error: 'Only image files are allowed' });
  }

  try {
    const response = await lighthouse.uploadBuffer(
      file.buffer,
      process.env.LIGHTHOUSE_API_KEY
    );

    if (response.data) {
      res.status(200).json({ success: true, ipfsHash: response.data.Hash });
    } else {
      throw new Error('Failed to upload to Lighthouse');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Failed to upload to Lighthouse');
  }
});

router.patch('/update/transactionurl', async (req, res) => {
  try {
    await connectToDB();

    const { cid, nft } = req.body;
    
    const transactionUrl = `https://explorer.aptoslabs.com/txn/${nft}/payload?network=testnet`;

    const post = await Post.findOne({ cid: cid });
    if (!post) return res.status(404).send('Post not found');

    post.transactionUrl = transactionUrl;
    await post.save();

    res.status(200).json({ success: true, message: 'Transaction URL updated', transactionUrl });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

export default router;
