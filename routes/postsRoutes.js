import express from 'express';
import Post from '../models/post.js';
import User from '../models/user.js';
import { connectToDB } from '../utils/database.js';

const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    await connectToDB();

    const posts = await Post.find().populate('creator').sort({ timestamp: -1 });
    if (!posts) return res.status(404).send('Posts not found');

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to fetch posts');
  }
});

export default router;
