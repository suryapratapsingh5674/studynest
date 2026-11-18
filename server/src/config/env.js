import dotenv from 'dotenv';
dotenv.config();

// Centralized environment variable validator and configuration export
const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/studynest',
  jwtSecret: process.env.JWT_SECRET || 'studynest_super_secret_jwt_dev_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Qdrant
  qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
  qdrantApiKey: process.env.QDRANT_API_KEY || '',
  qdrantCollection: process.env.QDRANT_COLLECTION || 'studynest_documents',
  
  // Cloudflare Workers AI
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
    baseUrl: process.env.CLOUDFLARE_BASE_URL || (process.env.CLOUDFLARE_ACCOUNT_ID 
      ? `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1` 
      : ''),
    chatModel: process.env.CLOUDFLARE_CHAT_MODEL || '@cf/meta/llama-3.2-3b-instruct',
    embeddingModel: process.env.CLOUDFLARE_EMBEDDING_MODEL || '@cf/baai/bge-base-en-v1.5',
    embeddingDimension: parseInt(process.env.EMBEDDING_DIMENSION, 10) || 768,
  },

  // Rate Limiting & Protection
  rateLimit: {
    generalWindowMs: parseInt(process.env.RATE_LIMIT_GENERAL_WINDOW_MS, 10) || 15 * 60 * 1000,
    generalMax: parseInt(process.env.RATE_LIMIT_GENERAL_MAX, 10) || 200,
    authWindowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 10) || 15 * 60 * 1000,
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 15,
    aiWindowMs: parseInt(process.env.RATE_LIMIT_AI_WINDOW_MS, 10) || 60 * 1000,
    aiMax: parseInt(process.env.RATE_LIMIT_AI_MAX, 10) || 20,
  },
};

export default config;

