import mongoose from 'mongoose';

const ReplyingToSchema = new mongoose.Schema({
  cid: {
    type: String,
    required: true,
    immutable: true,
  },
  address: {
    type: String,
    required: true,
    immutable: true,
  },
}, { _id: false });

const PostSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
    immutable: true,
  },
  cid: {
    type: String,
    required: [true, 'cid is required'],
    immutable: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  replyingTo: [ReplyingToSchema],
  transactionUrl: {
    type: String,
    required: false,
  },
});

export default mongoose.models.Post || mongoose.model('Post', PostSchema);
