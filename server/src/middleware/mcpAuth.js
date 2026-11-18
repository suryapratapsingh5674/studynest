import MCPApiKey from '../models/MCPApiKey.js';
import User from '../models/User.js';
import { hashApiKey } from '../utils/apiKey.js';
import { verifyToken } from '../utils/auth.js';

/**
 * Middleware that authenticates requests either via an MCP API Key (X-API-Key)
 * or via standard JWT Bearer token.
 */
export const requireMcpAuth = async (req, res, next) => {
  try {
    const apiKeyHeader = req.headers['x-api-key'];
    const authHeader = req.headers.authorization;

    let rawKey = null;

    if (apiKeyHeader) {
      rawKey = apiKeyHeader.trim();
    } else if (authHeader && authHeader.startsWith('Bearer sn_live_')) {
      rawKey = authHeader.split(' ')[1].trim();
    }

    // 1. Authenticate via MCP API Key
    if (rawKey) {
      const keyHash = hashApiKey(rawKey);
      const apiKeyDoc = await MCPApiKey.findOne({ keyHash, revokedAt: null });

      if (!apiKeyDoc) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or revoked MCP API Key. Please provide an active key.',
        });
      }

      const user = await User.findById(apiKeyDoc.userId).select('-passwordHash');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User associated with this API key no longer exists.',
        });
      }

      // Update lastUsedAt asynchronously
      apiKeyDoc.lastUsedAt = new Date();
      apiKeyDoc.save().catch(() => {});

      req.user = user;
      req.apiKey = apiKeyDoc;
      return next();
    }

    // 2. Fallback: Authenticate via standard JWT Bearer token (for web UI testing)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId).select('-passwordHash');
        if (user) {
          req.user = user;
          return next();
        }
      } catch (jwtErr) {
        // Fall through to 401
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a valid X-API-Key header (sn_live_...) or Bearer token.',
    });
  } catch (error) {
    console.error('[MCP Auth Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal authentication error.',
    });
  }
};

