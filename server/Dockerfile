# --- StudyNest Backend Production Dockerfile ---
FROM node:20-alpine AS base

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy application source code
COPY src ./src

# Create uploads directory and assign ownership to non-root node user
RUN mkdir -p uploads && chown -R node:node /app

# Switch to unprivileged user
USER node

# Expose server port
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start production server
CMD ["node", "src/server.js"]

