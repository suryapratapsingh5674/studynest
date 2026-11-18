import { ChatOpenAI } from '@langchain/openai';
import { Embeddings } from '@langchain/core/embeddings';
import config from '../../config/env.js';

/**
 * Validates whether Cloudflare Workers AI credentials are configured.
 * @throws {Error} if credentials are missing
 */
export const validateCloudflareCredentials = () => {
  const { accountId, apiToken, baseUrl } = config.cloudflare;
  if (!accountId || !apiToken) {
    throw new Error(
      'Cloudflare Workers AI credentials missing! Please configure CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in server/.env'
    );
  }
  return { accountId, apiToken, baseUrl };
};

/**
 * Creates and returns an instance of LangChain ChatOpenAI configured
 * for Cloudflare Workers AI's OpenAI-compatible /v1 endpoint.
 *
 * @param {Object} options
 * @param {number} [options.temperature=0.3] - LLM temperature
 * @param {number} [options.maxTokens=512] - Token limit to conserve free tier quota
 * @returns {ChatOpenAI}
 */
export const createChatModel = (options = {}) => {
  const { apiToken, baseUrl } = validateCloudflareCredentials();
  
  return new ChatOpenAI({
    modelName: config.cloudflare.chatModel,
    openAIApiKey: apiToken,
    configuration: {
      baseURL: baseUrl,
    },
    temperature: options.temperature ?? 0.3,
    maxTokens: options.maxTokens ?? 512,
  });
};

/**
 * Custom LangChain Embeddings provider for Cloudflare Workers AI.
 * 
 * Directly queries Cloudflare's OpenAI-compatible /embeddings endpoint
 * and parses raw float arrays to guarantee the true 768-dimension vector
 * without SDK base64 decompression discrepancies.
 */
export class CloudflareEmbeddings extends Embeddings {
  constructor(fields = {}) {
    super(fields);
    const { apiToken, baseUrl } = validateCloudflareCredentials();
    this.model = fields.model || config.cloudflare.embeddingModel;
    this.baseUrl = baseUrl;
    this.apiToken = apiToken;
    this.batchSize = fields.batchSize || 10;
  }

  /**
   * Embed an array of document chunks.
   * @param {string[]} texts
   * @returns {Promise<number[][]>}
   */
  async embedDocuments(texts) {
    if (!texts || texts.length === 0) return [];

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Cloudflare Embedding API error (${response.status}): ${errText}`);
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Malformed embedding response from Cloudflare Workers AI');
    }

    return data.data.map((item) => item.embedding);
  }

  /**
   * Embed a single query string for semantic search.
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async embedQuery(text) {
    const embeddings = await this.embedDocuments([text]);
    return embeddings[0];
  }
}

/**
 * Creates and returns an instance of CloudflareEmbeddings.
 * @returns {CloudflareEmbeddings}
 */
export const createEmbeddingModel = (options = {}) => {
  return new CloudflareEmbeddings(options);
};

/**
 * Formats common Cloudflare Workers AI errors into clear, student-friendly messages.
 *
 * @param {Error} error
 * @returns {Error}
 */
export const formatCloudflareError = (error) => {
  const status = error.status || error.statusCode;
  const message = error.message || '';

  if (status === 401 || message.includes('401') || message.includes('Unauthorized')) {
    return new Error(
      'Cloudflare Authentication Error: Invalid CLOUDFLARE_API_TOKEN or missing permissions. Ensure token has "Workers AI: Read" permissions.'
    );
  }

  if (status === 429 || message.includes('429') || message.includes('rate limit') || message.includes('quota')) {
    return new Error(
      'Cloudflare Rate Limit / Quota Exceeded: Free tier daily inference allowance limit reached or request rate too fast. Please retry later.'
    );
  }

  if (status === 404 || message.includes('404') || message.includes('model not found')) {
    return new Error(
      `Cloudflare Model Error: Model "${config.cloudflare.chatModel}" or "${config.cloudflare.embeddingModel}" not found on Cloudflare Workers AI.`
    );
  }

  return error;
};
