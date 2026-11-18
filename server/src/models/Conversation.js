import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    notebookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notebook',
      required: [true, 'Notebook ID is required'],
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'New Conversation',
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to list notebook conversations sorted by latest activity
conversationSchema.index({ notebookId: 1, updatedAt: -1 });
conversationSchema.index({ userId: 1, notebookId: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;

