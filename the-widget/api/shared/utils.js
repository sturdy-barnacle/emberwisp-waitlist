// Shared utility functions used across API endpoints
// Includes email validation, normalization, token generation, CORS handling, and IP extraction

import crypto from 'crypto';

/**
 * Validates an email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Normalizes an email address (lowercase, trimmed)
 * @param {string} email - Email address to normalize
 * @returns {string} - Normalized email address
 */
export function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

/**
 * Generates a cryptographically secure random token
 * @param {number} bytes - Number of random bytes (default: 32)
 * @returns {string} - Hexadecimal token string
 */
export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Gets CORS headers for a given origin
 * @param {string} origin - Request origin
 * @param {string[]} allowedOrigins - Array of allowed origins (defaults to empty array)
 * @returns {Object} - CORS headers object
 */
export function getCorsHeaders(origin, allowedOrigins = []) {
  // Fallback to wildcard if no allowed origins configured
  if (!allowedOrigins || allowedOrigins.length === 0) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }
  
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/**
 * Extracts client IP address from request headers
 * @param {Object} req - Request object
 * @returns {string} - Client IP address or 'unknown'
 */
export function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.socket?.remoteAddress || 
         'unknown';
}

