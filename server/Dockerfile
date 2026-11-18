# --- StudyNest Backend Production Dockerfile ---
FROM node:22-bookworm-slim AS base

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Install dependencies using standard glibc prebuilts
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code
COPY src ./src

# Create uploads directory and assign ownership to non-root node user
RUN mkdir -p uploads && chown -R node:node /app

# Switch to unprivileged user
USER node

# Expose server port
EXPOSE 3000

# Start production server
CMD ["node", "src/server.js"]

