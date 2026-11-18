import crypto from 'crypto';
import fs from 'fs';

/**
 * Computes the SHA-256 checksum hash of a file using streams.
 * Memory efficient for larger PDFs.
 *
 * @param {string} filePath
 * @returns {Promise<string>} 64-character hex hash
 */
export const calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

