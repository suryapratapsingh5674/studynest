import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import config from './config/env.js';
import { connectDB } from './config/db.js';
import { getQdrantClient, extractQdrantError } from './services/rag/qdrant.service.js';
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
// Dynamic CORS configuration allowing Vercel, localhost, and configured clients
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile, curl, Postman, MCP)
    if (!origin) return callback(null, true);

    // If clientUrl is set to '*', matches origin, or is localhost/vercel
    if (
      config.clientUrl === '*' ||
      config.clientUrl === origin ||
      origin.includes('vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    // Default: allow all valid client origins dynamically while preserving credentials
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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

// Comprehensive Health Check Handler
const healthCheckHandler = async (req, res) => {
  const mongoStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const memUsage = process.memoryUsage();

  const vectorDbStatus = {
    provider: 'Qdrant',
    url: config.qdrantUrl,
    collection: config.qdrantCollection,
    connected: false,
  };

  try {
    const qdrant = getQdrantClient();
    const info = await qdrant.getCollection(config.qdrantCollection);
    vectorDbStatus.connected = true;
    vectorDbStatus.pointsCount = info.points_count || info.vectors_count || 0;
    vectorDbStatus.vectorSize = info.config?.params?.vectors?.size;
  } catch (err) {
    vectorDbStatus.connected = false;
    vectorDbStatus.error = extractQdrantError(err);
  }

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
      vectorDb: vectorDbStatus,
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
};

app.get('/api/health', healthCheckHandler);
app.get('/health', healthCheckHandler);

// Mount application API routes (both /api and top-level for client resilience)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/notebooks', notebookRoutes);
app.use('/notebooks', notebookRoutes);

app.use('/api', documentRoutes);
app.use('/', documentRoutes);

app.use('/api', chatRoutes);
app.use('/', chatRoutes);

app.use('/api', studyToolsRoutes);
app.use('/', studyToolsRoutes);

app.use('/api/mcp', mcpRoutes);
app.use('/mcp', mcpRoutes);

// In production, serve static assets and handle SPA fallback if client dist exists
if (config.nodeEnv === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }
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

// Process-level crash prevention & diagnostics
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL Unhandled Rejection]:', reason);
});

const startServer = async () => {
  const port = parseInt(process.env.PORT, 10) || config.port || 3000;

  // 1. Immediately bind to 0.0.0.0 so cloud reverse proxies and health probes pass
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`[StudyNest API] Server listening on 0.0.0.0:${port}`);
    console.log(`[StudyNest API] Environment: ${config.nodeEnv}`);
    console.log(`[StudyNest API] Health Check: http://0.0.0.0:${port}/api/health`);
  });

  // 2. Connect to MongoDB in background without blocking server startup
  connectDB().catch((err) => {
    console.error('[MongoDB Startup Warning]:', err.message);
  });

  return server;
};

// Start server automatically in production or when executed as application entry point
const shouldAutoStart = 
  process.env.NODE_ENV === 'production' || 
  process.argv[1]?.includes('server') || 
  !process.env.NO_AUTO_START;

if (shouldAutoStart && process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
