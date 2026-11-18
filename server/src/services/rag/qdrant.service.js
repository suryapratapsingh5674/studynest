import { QdrantClient } from '@qdrant/js-client-rest';
import crypto from 'crypto';
import config from '../../config/env.js';

let client = null;

/**
 * Returns a singleton instance of the Qdrant REST client.
 */
export const getQdrantClient = () => {
  if (!client) {
    client = new QdrantClient({
      url: config.qdrantUrl,
      apiKey: config.qdrantApiKey || undefined,
      checkCompatibility: false,
    });
  }
  return client;
};

/**
 * Ensures the StudyNest documents collection exists in Qdrant with the verified
 * 768-dimension configuration and Cosine distance metric.
 */
export const ensureCollection = async () => {
  const qdrant = getQdrantClient();
  const collectionName = config.qdrantCollection;

  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections?.some((c) => c.name === collectionName);

    if (!exists) {
      console.log(`[Qdrant] Creating collection "${collectionName}" (Dim: ${config.cloudflare.embeddingDimension}, Metric: Cosine)...`);
      await qdrant.createCollection(collectionName, {
        vectors: {
          size: config.cloudflare.embeddingDimension, // 768
          distance: 'Cosine',
        },
      });
      console.log(`[Qdrant] Collection "${collectionName}" created successfully.`);
    }

    return true;
  } catch (error) {
    console.error(`[Qdrant Error]: Could not ensure collection "${collectionName}":`, error.message);
    throw new Error(
      `Qdrant Vector Database connection error: ${error.message}. Is Qdrant running on ${config.qdrantUrl}? (Run 'npm run qdrant:up')`
    );
  }
};

/**
 * Upserts an array of vector points into the Qdrant collection.
 *
 * @param {Array<{ vector: number[], payload: Object }>} points
 */
export const upsertPoints = async (points) => {
  if (!points || points.length === 0) return;

  await ensureCollection();
  const qdrant = getQdrantClient();

  const formattedPoints = points.map((p) => ({
    id: crypto.randomUUID(),
    vector: p.vector,
    payload: p.payload,
  }));

  try {
    await qdrant.upsert(config.qdrantCollection, {
      wait: true,
      points: formattedPoints,
    });
  } catch (error) {
    console.error('[Qdrant Upsert Error]:', error.message);
    throw new Error(`Failed to store vector points in Qdrant: ${error.message}`);
  }
};

/**
 * Deletes all vector points associated with a specific document.
 * Enforces ownership by matching both documentId and userId.
 *
 * @param {string} documentId
 * @param {string} userId
 */
export const deleteDocumentVectors = async (documentId, userId) => {
  const qdrant = getQdrantClient();

  try {
    await qdrant.delete(config.qdrantCollection, {
      wait: true,
      filter: {
        must: [
          { key: 'documentId', match: { value: documentId.toString() } },
          { key: 'userId', match: { value: userId.toString() } },
        ],
      },
    });
  } catch (error) {
    console.warn(`[Qdrant] Note on deleting vectors for document ${documentId}: ${error.message}`);
  }
};

/**
 * Performs filtered semantic search against Qdrant.
 * Scoped strictly to the authenticated user and notebook.
 *
 * @param {Object} params
 * @param {number[]} params.queryVector - 768-dim query embedding
 * @param {string} params.userId
 * @param {string} params.notebookId
 * @param {number} [params.limit=5]
 * @returns {Promise<Array<Object>>}
 */
export const searchVectors = async ({ queryVector, userId, notebookId, limit = 5 }) => {
  const qdrant = getQdrantClient();

  const filter = {
    must: [
      { key: 'userId', match: { value: userId.toString() } },
      { key: 'notebookId', match: { value: notebookId.toString() } },
    ],
  };

  let hits = [];

  // Qdrant JS client v1.11+ uses Universal Query API (query), while older clients used search
  if (typeof qdrant.query === 'function') {
    const res = await qdrant.query(config.qdrantCollection, {
      query: queryVector,
      limit,
      with_payload: true,
      filter,
    });
    hits = res?.points || (Array.isArray(res) ? res : []);
  } else if (typeof qdrant.search === 'function') {
    const res = await qdrant.search(config.qdrantCollection, {
      vector: queryVector,
      limit,
      with_payload: true,
      filter,
    });
    hits = Array.isArray(res) ? res : (res?.points || []);
  } else {
    throw new Error('Qdrant client does not support query or search operations.');
  }

  return (hits || []).map((hit) => ({
    score: hit.score,
    ...hit.payload,
  }));
};

