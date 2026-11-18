import crypto from 'crypto';

/**
 * Generates a new secure, random MCP API Key.
 *
 * @returns {{ key: string, keyHash: string, prefix: string }}
 */
export const generateApiKey = () => {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const key = `sn_live_${randomBytes}`;
  const keyHash = hashApiKey(key);
  const prefix = key.slice(0, 16) + '...';

  return { key, keyHash, prefix };
};

/**
 * Computes the SHA-256 hash of an API key for safe database storage and lookup.
 *
 * @param {string} key
 * @returns {string} hex hash
 */
export const hashApiKey = (key) => {
  return crypto.createHash('sha256').update(key.trim()).digest('hex');
};

