import path from 'path';
import { sendJson, errorResponse } from './response.js';

/**
 * Keep names filesystem safe and compatible with future routes.
 * Removes null bytes, slashes, backslashes, and double dots.
 * Only allows alphanumeric, underscores, hyphens, and spaces.
 */
export function sanitizeName(value) {
  if (typeof value !== 'string') return '';
  
  // Remove null bytes, slashes, backslashes, and double dots
  let sanitized = value.replace(/[\0\/\\\.\.]/g, '');
  
  // Only allow alphanumeric, underscores, hyphens, and spaces
  sanitized = sanitized.replace(/[^a-zA-Z0-9_\-\s]/g, '');
  
  return sanitized.trim();
}

/**
 * Convert a user path into safe normalized note/folder segments.
 * Validates each path segment for allowed characters.
 */
export function sanitizePathSegments(pathStr) {
  const parts = pathStr
    .split('/')
    .filter(part => part.length > 0);
  
  const cleanParts = [];
  
  for (const part of parts) {
    const cleanPart = part.trim();
    
    // Reject empty, dot, double dot, or segments with invalid characters
    if (
      cleanPart === '' ||
      cleanPart === '.' ||
      cleanPart === '..' ||
      cleanPart.includes('\0') ||
      cleanPart.includes('/') ||
      cleanPart.includes('\\') ||
      /[^a-zA-Z0-9_.\-\s\(\)]/.test(cleanPart)
    ) {
      return null; // Signal invalid segment
    }
    
    cleanParts.push(cleanPart);
  }
  
  return cleanParts;
}

/**
 * Verify a resolved path never escapes the vault root.
 * Normalizes both paths and checks if target starts with root.
 */
export function isInsideRoot(targetPath, rootPath) {
  const normalizedPath = path.normalize(targetPath).replace(/\\/g, '/');
  const normalizedRoot = path.normalize(rootPath).replace(/\\/g, '/');
  
  return normalizedPath.startsWith(normalizedRoot + '/') || 
         normalizedPath === normalizedRoot;
}

/**
 * Express middleware to validate path segments in request
 */
export function validatePathSegments(req, res, next) {
  const pathParam = req.params[0] || req.params.path || req.body.path;
  
  if (pathParam !== undefined) {
    const segments = sanitizePathSegments(pathParam);
    if (segments === null) {
      return sendJson(res, 400, errorResponse('Invalid path segment'));
    }
    req.sanitizedSegments = segments;
  }
  
  next();
}
