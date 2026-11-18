import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import config from './config/env.js';
import { connectDB } from './config/db.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/auth.routes.js';
import notebookRoutes from './routes/notebook.routes.js';
import documentRoutes from './routes/document.routes.js';
import chatRoutes from './routes/chat.routes.js';
import studyToolsRoutes from './routes/studyTools.routes.js';
import mcpRoutes from './routes/mcp.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiting across all API endpoints
app.use('/api', generalLimiter);

// Root endpoint for platform health probes & sanity check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'StudyNest API',
    message: 'StudyNest API is operational.',
    healthCheck: '/api/health',
  });
});

// Comprehensive Health Check Route
app.get('/api/health', (req, res) => {
  const mongoStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const memUsage = process.memoryUsage();

  res.status(200).json({
    status: 'ok',
    app: 'StudyNest API',
    environment: config.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: mongoStates[mongoose.connection.readyState] || 'unknown',
        connected: mongoose.connection.readyState === 1,
      },
      vectorDb: {
        provider: 'Qdrant',
        url: config.qdrantUrl,
        collection: config.qdrantCollection,
      },
      aiProvider: {
        provider: 'Cloudflare Workers AI',
        chatModel: config.cloudflare.chatModel,
        embeddingModel: config.cloudflare.embeddingModel,
        dimension: config.cloudflare.embeddingDimension,
        configured: Boolean(config.cloudflare.accountId && config.cloudflare.apiToken),
      },
    },
    aiConfig: {
      provider: 'Cloudflare Workers AI',
      chatModel: config.cloudflare.chatModel,
      embeddingModel: config.cloudflare.embeddingModel,
      embeddingDimension: config.cloudflare.embeddingDimension,
      configured: Boolean(config.cloudflare.accountId && config.cloudflare.apiToken),
    },
    system: {
      memory: {
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      },
    },
  });
});

// Mount application API routes
app.use('/api/auth', authRoutes);
app.use('/api/notebooks', notebookRoutes);
app.use('/api', documentRoutes);
app.use('/api', chatRoutes);
app.use('/api', studyToolsRoutes);
app.use('/api/mcp', mcpRoutes);

// In production, serve static assets and handle SPA fallback
if (config.nodeEnv === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 404 handler for undefined API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  app.listen(config.port, () => {
    console.log(`[StudyNest API] Server running on http://localhost:${config.port}`);
    console.log(`[StudyNest API] Environment: ${config.nodeEnv}`);
    console.log(`[StudyNest API] Health Check: http://localhost:${config.port}/api/health`);
  });
};

// Start server if executed directly
if (process.argv[1]?.endsWith('server.js')) {
  startServer();
}

export default app;
