# StudyNest: AI-Powered Study Companion

StudyNest is a full-stack, AI-powered study workspace. Users upload educational documents (PDFs/TXT), chat with them using precision Retrieval-Augmented Generation (RAG), generate active recall study materials (summaries, flashcards, MCQs), maintain conversation history, and access their study workspace via Model Context Protocol (MCP).

---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, JavaScript, Tailwind CSS, TanStack Query v5, Axios, Lucide React, React Router
- **Backend**: Node.js, Express, MongoDB (Mongoose), Helmet, CORS, dotenv
- **AI & RAG**: Cloudflare Workers AI (`@cf/meta/llama-3.2-3b-instruct` and `@cf/baai/bge-base-en-v1.5`), LangChain.js (`@langchain/core`, `@langchain/openai`), Qdrant Vector DB
- **Protocol**: Model Context Protocol (MCP) TypeScript SDK v2 (Phase 6)

---

## 📁 Project Structure (Monorepo)

```text
studynest/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Layout & presentation components
│   │   ├── hooks/          # TanStack Query & custom hooks
│   │   ├── pages/          # App pages (Dashboard, Notebooks, etc.)
│   │   ├── services/       # API call definitions (Axios)
│   │   ├── App.jsx         # App router and providers
│   │   └── main.jsx        # Entry point
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Environment & DB configurations
│   │   ├── services/       # AI provider & business logic
│   │   ├── scripts/        # Verification & utility scripts
│   │   └── server.js       # Express server entry point
│   ├── .env.example
│   └── package.json
├── docker-compose.yml       # Qdrant Vector DB service
├── README.md
└── package.json            # Root scripts
```

---

## 🚀 Phase 1 Setup & Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested with v24)
- **Docker Desktop**: for running local Qdrant vector database
- **MongoDB**: local instance (`mongodb://localhost:27017`) or free MongoDB Atlas cluster
- **Cloudflare Account**: free account with Workers AI enabled

### 2. Environment Configuration
Copy the sample environment file in `server/`:

```bash
cp server/.env.example server/.env
```

Open `server/.env` and supply your Cloudflare credentials:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/studynest

QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION=studynest_documents

CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_CHAT_MODEL=@cf/meta/llama-3.2-3b-instruct
CLOUDFLARE_EMBEDDING_MODEL=@cf/baai/bge-base-en-v1.5
EMBEDDING_DIMENSION=768
```

> **How to get Cloudflare credentials:**
> 1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
> 2. Copy your **Account ID** from the right sidebar on your home screen or Workers & Pages overview.
> 3. Go to **My Profile > API Tokens > Create Token**.
> 4. Use the **Workers AI** template or create a custom token with permission `Account > Workers AI > Read`.
> 5. Paste both values into `server/.env`.

---

### 3. Start Local Vector Database (Qdrant)
Ensure Docker Desktop is running, then run:

```bash
npm run qdrant:up
```
Qdrant Web Dashboard will be available at: `http://localhost:6333/dashboard`.

---

### 4. Run Verification Tests
Verify your Cloudflare Workers AI connection and Phase 2 authentication/notebook models:

```bash
# Verify Cloudflare AI (chat generation & 768-dim embeddings)
npm run test:ai

# Verify Argon2id hashing, JWT, and Notebook CRUD isolation
npm run test:phase2

# Verify Document extraction, chunking, BGE embedding, and lifecycle states
npm run test:phase3

# Verify RAG prompt assembly, Llama 3.2 3B grounded generation, and citations
npm run test:phase4

# Verify Summaries, JSON-validated Flashcards, and 4-Option MCQ Quizzes
npm run test:phase5

# Verify User-scoped MCP API keys, SHA-256 storage, and MCP tools
npm run test:phase6
```

This tests:
1. Credentials format and configuration.
2. Short text completion with `@cf/meta/llama-3.2-3b-instruct`.
3. Query embedding with `@cf/baai/bge-base-en-v1.5`.
4. Validates that returned embedding dimension is exactly `768`.
5. Batch document embedding.

---

### 5. Running the Application

**Start the Express Backend:**
```bash
npm run dev:server
# Server runs at http://localhost:5000 (Health Check: http://localhost:5000/api/health)
```

**Start the React Frontend (in a separate terminal):**
```bash
npm run dev:client
# Frontend runs at http://localhost:5173
```

---

## 📜 Development Rules & AI Quota Policy
- **No LLM on Boot**: Express never initiates AI calls on server startup.
- **Strict Free-Plan Compliance**: Cloudflare Workers AI is our sole inference provider.
- **Verified Vector Dimension**: Collection and embedding configs strictly match 768.
- **Phase-by-Phase**: Code is written iteratively with review and approval at every phase.

