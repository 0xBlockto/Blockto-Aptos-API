import express from 'express';
import User from '../models/user.js';
import { connectToDB } from '../utils/database.js';

const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    await connectToDB();
    const users = await User.find().sort({ timestamp: -1 });
    if (!users) {
      return res.status(404).json({ message: 'Users not found' });
    }
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

export default router;
