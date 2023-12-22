import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  address: {
    type: String,
    unique: [true, 'Address already exists'],
    required: [true, 'Address is required'],
    immutable: true,
  },
  username: {
    type: String,
    unique: [true, 'Username already exists'],
    required: [true, 'Username is required'],
  },
  name: {
    type: String,
  },
  profilePicture: {
    type: String,
  },
  bio: {
    type: String,
  },
  email: {
    type: String,
  },
  website: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    immutable: true,
  }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
