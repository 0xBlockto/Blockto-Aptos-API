import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import imagesRoutes from './routes/imagesRoutes.js';
import nftRoutes from './routes/nftRoutes.js';
import postRoutes from './routes/postRoutes.js';
import postsRoutes from './routes/postsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import usersRoutes from './routes/usersRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/images', imagesRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/post', postRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', usersRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
