# StudyNest Model Context Protocol (MCP) Server

This standalone package provides an official Model Context Protocol (MCP) server for StudyNest. It allows external AI clients (Claude Desktop, Cursor, Antigravity, etc.) to securely explore, read, and search the user's educational notebooks using precision semantic retrieval.

---

## 🛠️ Implemented MCP Tools

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `list_notebooks` | *None* | Returns all study notebooks belonging to the authenticated student. |
| `list_documents` | `notebookId` | Lists all uploaded course documents (PDFs, notes) inside a specific notebook. |
| `search_notebook` | `notebookId`, `query`, `limit?` | Executes semantic vector retrieval across all documents in a notebook using StudyNest's 768-dim BGE embeddings. |
| `get_document_excerpt` | `documentId`, `page?` | Retrieves raw text excerpt from a specific document page with page metadata. |
| `get_notebook_summary` | `documentId` | Retrieves an existing synthesized executive summary and key takeaways. |

---

## 📦 Implemented MCP Resources

- `studynest://notebooks`: Catalog of user's notebooks.
- `studynest://notebooks/{id}`: Detailed notebook view and documents list.

---

## 🔒 Security & Multi-Tenant Authentication

- **User-Scoped API Keys**: Generated from StudyNest web UI (**Settings > MCP API Keys**).
- **Hashed Storage**: Keys are hashed using SHA-256 before storage in MongoDB. Raw keys are never stored.
- **Strict Tenant Isolation**: All tools verify user ownership at the API level. An API key from User A cannot access User B's documents or search their vectors.
- **Read-Only Scope**: The MCP server operates in read-only mode to prevent external clients from modifying or deleting notes.

---

## 🚀 Setting Up with Claude Desktop

Add this configuration to your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "studynest": {
      "command": "node",
      "args": [
        "C:\\Users\\surya\\Documents\\VScode\\studyNest\\mcp-server\\src\\index.js"
      ],
      "env": {
        "STUDYNEST_API_URL": "http://localhost:5000/api/mcp",
        "STUDYNEST_API_KEY": "sn_live_YOUR_API_KEY_HERE"
      }
    }
  }
}
```

---

## 🧪 Testing with MCP Inspector

You can inspect and test the server interactively using the official MCP Inspector:

```bash
cd mcp-server
npx @modelcontextprotocol/inspector node src/index.js
```

1. Open the inspector URL in your browser.
2. Under **Environment Variables**, set:
   - `STUDYNEST_API_KEY`: your generated `sn_live_...` key.
   - `STUDYNEST_API_URL`: `http://localhost:5000/api/mcp`.
3. Test tool calls (`list_notebooks`, `search_notebook`, etc.).

