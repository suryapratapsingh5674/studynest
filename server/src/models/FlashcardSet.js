import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const flashcardSetSchema = new mongoose.Schema(
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
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Flashcard set title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    cards: {
      type: [cardSchema],
      required: true,
      validate: [(val) => val.length > 0, 'Flashcard set must contain at least one card'],
    },
  },
  {
    timestamps: true,
  }
);

flashcardSetSchema.index({ notebookId: 1, updatedAt: -1 });
flashcardSetSchema.index({ userId: 1, notebookId: 1 });

const FlashcardSet = mongoose.model('FlashcardSet', flashcardSetSchema);
export default FlashcardSet;

