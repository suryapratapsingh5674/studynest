#!/usr/bin/env node

/**
 * StudyNest MCP Server Entry Point
 * Implements Model Context Protocol using STDIO transport for external AI clients
 * (Claude Desktop, Cursor, Antigravity, MCP Inspector).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { validateMcpConfig } from './config/index.js';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/index.js';

async function run() {
  validateMcpConfig();

  // Initialize MCP Server
  const server = new Server(
    {
      name: 'studynest-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Register tools and resources
  registerTools(server);
  registerResources(server);

  // Connect via STDIO transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[StudyNest MCP Server] Started successfully via STDIO transport.');
}

run().catch((error) => {
  console.error('[StudyNest MCP Server Fatal Error]:', error);
  process.exit(1);
});

