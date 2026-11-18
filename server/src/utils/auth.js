import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';

/**
 * Hashes a plain-text password using the memory-hard Argon2id algorithm.
 * @param {string} password
 * @returns {Promise<string>}
 */
export const hashPassword = async (password) => {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
};

/**
 * Verifies a plain-text password against an Argon2id hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export const verifyPassword = async (password, hash) => {
  return argon2.verify(hash, password);
};

/**
 * Generates a signed JSON Web Token (JWT) for an authenticated user.
 * @param {Object} user - User object with _id and email
 * @returns {string}
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );
};

/**
 * Verifies a JWT token string.
 * @param {string} token
 * @returns {Object} decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

