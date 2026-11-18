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

export const extractQdrantError = (err) => {
  if (err?.data?.status?.error) return err.data.status.error;
  if (err?.response?.data?.status?.error) return err.response.data.status.error;
  if (err?.data?.error) return err.data.error;
  if (typeof err?.data === 'string') return err.data;
  return err?.message || 'Qdrant Error';
};

/**
 * Ensures the StudyNest documents collection exists in Qdrant with the verified
 * 768-dimension configuration and Cosine distance metric.
 */
export const ensureCollection = async () => {
  const qdrant = getQdrantClient();
  const collectionName = config.qdrantCollection;
  const targetDimension = config.cloudflare.embeddingDimension || 768;

  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections?.some((c) => c.name === collectionName);

    if (!exists) {
      console.log(`[Qdrant] Creating collection "${collectionName}" (Dim: ${targetDimension}, Metric: Cosine)...`);
      await qdrant.createCollection(collectionName, {
        vectors: {
          size: targetDimension,
          distance: 'Cosine',
        },
      });
      console.log(`[Qdrant] Collection "${collectionName}" created successfully.`);
    } else {
      // Validate vector dimensions match the embedding model (768)
      try {
        const info = await qdrant.getCollection(collectionName);
        const currentSize = info.config?.params?.vectors?.size;
        if (currentSize && currentSize !== targetDimension) {
          console.warn(`[Qdrant Dimension Mismatch]: Existing collection has dim ${currentSize}, target is ${targetDimension}. Recreating...`);
          await qdrant.deleteCollection(collectionName);
          await qdrant.createCollection(collectionName, {
            vectors: {
              size: targetDimension,
              distance: 'Cosine',
            },
          });
          console.log(`[Qdrant] Recreated collection "${collectionName}" with dim ${targetDimension}.`);
        }
      } catch (infoErr) {
        console.warn('[Qdrant Info Check Warning]:', infoErr.message);
      }
    }

    return true;
  } catch (error) {
    const detail = extractQdrantError(error);
    console.error(`[Qdrant Error]: Could not ensure collection "${collectionName}":`, detail);
    throw new Error(
      `Qdrant Vector Database connection error: ${detail}. Is Qdrant running on ${config.qdrantUrl}?`
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
  await ensureCollection();

  const filter = {
    must: [
      { key: 'userId', match: { value: userId.toString() } },
      { key: 'notebookId', match: { value: notebookId.toString() } },
    ],
  };

  let hits = [];

  try {
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
  } catch (err) {
    const detail = extractQdrantError(err);
    console.error('[Qdrant Search Error Detail]:', detail, err?.data || err?.response?.data);
    throw new Error(detail);
  }

  return (hits || []).map((hit) => ({
    score: hit.score,
    ...hit.payload,
  }));
};

