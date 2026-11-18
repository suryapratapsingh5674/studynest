# StudyNest: Production Deployment & Operations Guide

This guide details how to build, containerize, and deploy StudyNest to production environments.

---

## 1. Architecture Overview

StudyNest operates in two production-ready deployment topologies:

### Topology A: Multi-Container Docker Compose (Recommended for VPS / Cloud VMs)
- **Nginx Reverse Proxy (`studynest-client:80`)**: Serves compiled static assets, handles Gzip compression, and proxies `/api/*` to the Node.js backend.
- **Express Backend (`studynest-server:5000`)**: Stateless Node.js application running with non-root user `node`.
- **Qdrant Vector Database (`studynest-qdrant:6333`)**: High-performance vector database with persisted disk volumes.
- **MongoDB Database (`studynest-mongodb:27017`)**: Document database with persisted volume storage.
- **Cloudflare Workers AI**: External managed serverless inference for Llama 3.2 3B Instruct and BGE-base embeddings.

```
       [ Client Browser / Mobile ]
                   │
                   ▼ (HTTP / Port 80)
     ┌─────────────────────────────┐
     │  Nginx Web Server / Proxy   │ (studynest-client)
     └─────────────┬───────────────┘
                   │ /api/*
                   ▼ (Port 5000)
     ┌─────────────────────────────┐
     │   Express.js API Server     │ (studynest-server)
     └───┬─────────────┬─────────┬─┘
         │             │         │
         ▼             ▼         ▼
    [ MongoDB ]   [ Qdrant ]  [ Cloudflare Workers AI ]
    (Port 27017)  (Port 6333) (HTTPS Hosted REST API)
```

### Topology B: Single-Dyno PaaS (Render / Railway / Fly.io)
- The Express backend (`server/src/server.js`) natively serves the built static frontend from `client/dist` when `NODE_ENV=production`.
- Connects to **MongoDB Atlas** and a managed **Qdrant Cloud** cluster.
- Minimizes compute costs to a single container/dyno.

---

## 2. Environment Variables Configuration

Create a production `.env` file in `server/.env` or supply these in your cloud container dashboard:

| Variable | Description | Example Value |
|---|---|---|
| `PORT` | Backend listening port | `5000` |
| `NODE_ENV` | Runtime environment | `production` |
| `CLIENT_URL` | Allowed CORS frontend origin | `http://localhost` or `https://studynest.yourdomain.com` |
| `JWT_SECRET` | 64+ character random string for signing JWT tokens | `generate-using-openssl-rand-hex-32` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://mongodb:27017/studynest` or MongoDB Atlas URI |
| `QDRANT_URL` | Qdrant REST API endpoint | `http://qdrant:6333` or Qdrant Cloud URL |
| `QDRANT_API_KEY` | Qdrant API key (required for Qdrant Cloud) | `your_qdrant_api_key` |
| `QDRANT_COLLECTION` | Vector collection name | `studynest_documents` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier | `your_cf_account_id` |
| `CLOUDFLARE_API_TOKEN` | Workers AI token with read permissions | `your_cf_api_token` |
| `CLOUDFLARE_BASE_URL` | Cloudflare Workers AI v1 OpenAI-compatible endpoint | `https://api.cloudflare.com/client/v4/accounts/{ID}/ai/v1` |
| `CLOUDFLARE_CHAT_MODEL` | Grounded chat LLM | `@cf/meta/llama-3.2-3b-instruct` |
| `CLOUDFLARE_EMBEDDING_MODEL` | Text embedding model | `@cf/baai/bge-base-en-v1.5` |
| `EMBEDDING_DIMENSION` | Vector embedding size | `768` |
| `RATE_LIMIT_GENERAL_WINDOW_MS` | General rate limit window (ms) | `900000` (15 min) |
| `RATE_LIMIT_GENERAL_MAX` | Max requests per general window | `200` |
| `RATE_LIMIT_AUTH_WINDOW_MS` | Auth rate limit window (ms) | `900000` (15 min) |
| `RATE_LIMIT_AUTH_MAX` | Max login/register attempts | `15` |
| `RATE_LIMIT_AI_WINDOW_MS` | AI inference rate limit window (ms) | `60000` (1 min) |
| `RATE_LIMIT_AI_MAX` | Max LLM/embedding inference requests | `20` |

---

## 3. Docker Compose Production Deployment

### Prerequisites
- Docker Engine 24+ & Docker Compose v2 installed on the target host.
- Cloudflare Workers AI Account ID and API Token configured.

### Step 1: Clone and Configure Environment
```bash
git clone https://github.com/your-username/studynest.git
cd studynest
cp server/.env.example server/.env
# Edit server/.env with your production secrets and Cloudflare credentials
```

### Step 2: Build and Launch Containers
```bash
# Launch the full multi-container production stack in background
docker compose -f docker-compose.prod.yml up --build -d
```

### Step 3: Verify Container Health
```bash
docker compose -f docker-compose.prod.yml ps
```
All four services (`studynest-mongodb`, `studynest-qdrant`, `studynest-server`, `studynest-client`) should show `Up (healthy)`.

### Step 4: Verify System Health Endpoint
```bash
curl http://localhost/api/health
```
Expected output:
```json
{
  "status": "ok",
  "app": "StudyNest API",
  "environment": "production",
  "uptimeSeconds": 14,
  "services": {
    "database": { "status": "connected", "connected": true },
    "vectorDb": { "provider": "Qdrant", "url": "http://qdrant:6333", "collection": "studynest_documents" },
    "aiProvider": {
      "provider": "Cloudflare Workers AI",
      "chatModel": "@cf/meta/llama-3.2-3b-instruct",
      "embeddingModel": "@cf/baai/bge-base-en-v1.5",
      "dimension": 768,
      "configured": true
    }
  },
  "system": {
    "memory": { "rssMB": 150, "heapUsedMB": 42 }
  }
}
```

---

## 4. Reverse Proxy & SSL (HTTPS) with Certbot

To secure StudyNest with TLS certificates on a public domain:

1. Point your domain DNS `A` record (e.g. `studynest.example.com`) to your server IP.
2. Install Certbot on the host:
   ```bash
   sudo apt update && sudo apt install -y certbot python3-certbot-nginx
   ```
3. Issue and bind Let's Encrypt certificates:
   ```bash
   sudo certbot --nginx -d studynest.example.com
   ```

---

## 5. MCP Server Production Access

External AI clients (Claude Desktop, Cursor, Antigravity) connect to StudyNest's MCP tools using API keys:

1. Log into StudyNest web UI at `https://studynest.example.com/login`.
2. Navigate to **Settings** (`/settings`).
3. Click **Create New Key**, label it (e.g. "Claude Desktop"), and copy the token `sn_live_...`.
4. Add the server entry to your Claude Desktop configuration (`claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "studynest": {
         "command": "node",
         "args": ["/path/to/studynest/mcp-server/src/index.js"],
         "env": {
           "STUDYNEST_API_URL": "https://studynest.example.com/api",
           "STUDYNEST_API_KEY": "sn_live_your_actual_key_here"
         }
       }
     }
   }
   ```
5. Restart Claude Desktop. StudyNest's 5 study tools (`list_notebooks`, `search_notebook`, etc.) are immediately available.

---

## 6. Production Maintenance & Monitoring

- **View Logs**:
  ```bash
  docker compose -f docker-compose.prod.yml logs -f server
  ```
- **Stop Containers**:
  ```bash
  docker compose -f docker-compose.prod.yml down
  ```
- **Backup MongoDB Data**:
  ```bash
  docker exec -t studynest-mongodb mongodump --archive --gzip > studynest_backup_$(date +%F).archive
  ```
- **Restore MongoDB Data**:
  ```bash
  docker exec -i studynest-mongodb mongorestore --archive --gzip < studynest_backup.archive
  ```

