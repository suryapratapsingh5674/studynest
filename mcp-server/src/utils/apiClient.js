import { config } from '../config/index.js';

/**
 * Standard HTTP client that communicates with the StudyNest backend API
 * using the authenticated user-scoped MCP API key.
 *
 * @param {string} endpoint - e.g. '/notebooks'
 * @param {Object} [options]
 * @returns {Promise<any>}
 */
export const fetchStudyNestAPI = async (endpoint, options = {}) => {
  const url = `${config.apiUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': config.apiKey,
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg = data?.message || `HTTP error ${response.status}: ${response.statusText}`;
      throw new Error(errMsg);
    }

    return data?.data;
  } catch (error) {
    console.error(`[StudyNest API Error] ${options.method || 'GET'} ${endpoint}:`, error.message);
    throw error;
  }
};

