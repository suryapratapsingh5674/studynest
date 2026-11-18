import mongoose from 'mongoose';

const mcpApiKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    prefix: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: [true, 'API Key name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    scopes: {
      type: [String],
      default: ['read'],
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Never expose keyHash in JSON output
mcpApiKeySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.keyHash;
  return obj;
};

const MCPApiKey = mongoose.model('MCPApiKey', mcpApiKeySchema);
export default MCPApiKey;

