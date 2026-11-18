import dotenv from 'dotenv';
dotenv.config();

export const config = {
  apiUrl: process.env.STUDYNEST_API_URL || 'http://localhost:5000/api/mcp',
  apiKey: process.env.STUDYNEST_API_KEY || '',
};

/**
 * Validates that the API Key is configured in environment variables.
 * Note: Errors in MCP servers must be printed to process.stderr so as not to corrupt stdio JSON-RPC.
 */
export const validateMcpConfig = () => {
  if (!config.apiKey) {
    console.error(
      '[StudyNest MCP Error] STUDYNEST_API_KEY is missing! Set STUDYNEST_API_KEY=sn_live_... in your environment or MCP client config.'
    );
    process.exit(1);
  }
};

