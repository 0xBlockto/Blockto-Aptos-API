import express from 'express';
import fetch from 'node-fetch';
import Post from '../models/post.js';
import { connectToDB } from '../utils/database.js';

const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    await connectToDB();

    const posts = await Post.find();

    let fileCIDs = [];
    for (const post of posts) {
      const response = await fetch(`${process.env.LIGHTHOUSE_GATEWAY}/${post.cid}`);
      if (response.ok) {
        const postData = await response.json();
        if (postData.files && postData.files.length > 0) {
          fileCIDs.push(postData.files[0].cid);
        }
      }
    }
    console.log("File CIDs:", fileCIDs);

    res.status(200).json(fileCIDs);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to fetch posts');
  }
});

export default router;
