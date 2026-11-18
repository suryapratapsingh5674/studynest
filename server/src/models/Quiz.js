import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: [(val) => val.length === 4, 'Each MCQ must have exactly 4 answer options'],
    },
    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
    },
    sourceReference: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
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
      required: [true, 'Quiz title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    questions: {
      type: [quizQuestionSchema],
      required: true,
      validate: [(val) => val.length > 0, 'Quiz must contain at least one question'],
    },
  },
  {
    timestamps: true,
  }
);

quizSchema.index({ notebookId: 1, updatedAt: -1 });
quizSchema.index({ userId: 1, notebookId: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;

