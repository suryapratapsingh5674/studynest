import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
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
    originalFilename: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
    },
    storedFilename: {
      type: String,
      required: [true, 'Stored filename is required'],
    },
    storagePath: {
      type: String,
      required: [true, 'Storage path is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size in bytes is required'],
    },
    fileHash: {
      type: String,
      required: [true, 'SHA-256 file hash is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'ready', 'failed'],
      default: 'uploaded',
      index: true,
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    processingError: {
      type: String,
      default: null,
    },
    embeddingModel: {
      type: String,
      default: '@cf/baai/bge-base-en-v1.5',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying notebook documents by status and date
documentSchema.index({ notebookId: 1, createdAt: -1 });
// Compound index to check for duplicate uploads within a user's notebook
documentSchema.index({ userId: 1, notebookId: 1, fileHash: 1 });

const Document = mongoose.model('Document', documentSchema);
export default Document;

