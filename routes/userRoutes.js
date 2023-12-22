import express from 'express';
import User from '../models/user.js';
import { connectToDB } from '../utils/database.js';

const router = express.Router();

router.get('/:address', async (req, res) => {
  try {
    await connectToDB();
    const user = await User.findOne({ address: req.params.address });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get users' });
  }
});

export default router;
