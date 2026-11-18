# --- StudyNest Backend Production Dockerfile ---
FROM node:20-alpine AS base

# Install build dependencies for native modules and curl/wget for healthcheck
RUN apk add --no-cache curl wget python3 make g++

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Install dependencies allowing build scripts (required for argon2 native bindings)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code
COPY src ./src

# Create uploads directory and assign ownership to non-root node user
RUN mkdir -p uploads && chown -R node:node /app

# Switch to unprivileged user
USER node

# Expose server port (both 3000 and 5000)
EXPOSE 3000
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/api/health || exit 1

# Start production server
CMD ["node", "src/server.js"]

