import rateLimit from 'express-rate-limit';
import config from '../config/env.js';

/**
 * General API Rate Limiter
 * Guards the overall API against volumetric flooding and scraping.
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.generalWindowMs,
  max: config.rateLimit.generalMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});

/**
 * Authentication Rate Limiter
 * Applied to login and registration endpoints to prevent brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
  },
});

/**
 * AI Inference Rate Limiter
 * Applied to chat questions, document summaries, flashcard generation, and quizzes.
 * Preserves Cloudflare Workers AI free-tier inference quota and prevents abuse.
 */
export const aiInferenceLimiter = rateLimit({
  windowMs: config.rateLimit.aiWindowMs,
  max: config.rateLimit.aiMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'AI request limit reached. Please wait a moment before sending more study questions or generation requests.',
  },
});

