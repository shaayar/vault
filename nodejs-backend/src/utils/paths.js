import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { sanitizeName, sanitizePathSegments, isInsideRoot } from './security.js';
import { sendJson, errorResponse } from './response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolve project vault root and ensure it exists.
 */
export function getVaultRoot() {
  const basePath = path.resolve(__dirname, '../../');
  const vaultRoot = path.join(basePath, 'vaults');
  
  if (!fs.existsSync(vaultRoot)) {
    try {
      fs.mkdirSync(vaultRoot, { recursive: true, mode: 0o775 });
    } catch (err) {
      throw new Error('Failed to initialize vault storage');
    }
  }
  
  return vaultRoot;
}

/**
 * Ensure vault notes directory exists and is safe.
 */
export function getNotesRoot(vaultRoot, vaultName) {
  const cleanVaultName = sanitizeName(vaultName);
  
  if (cleanVaultName === '') {
    throw new Error('Invalid vault name');
  }
  
  const notesRoot = path.join(vaultRoot, cleanVaultName, 'notes');
  
  if (!fs.existsSync(notesRoot)) {
    throw new Error('Vault notes directory not found');
  }
  
  const resolved = fs.realpathSync(notesRoot);
  
  if (!isInsideRoot(resolved, vaultRoot)) {
    throw new Error('Invalid notes path');
  }
  
  return resolved;
}

/**
 * Resolve a target path under notes root and verify directory boundary.
 */
export function resolveUnderNotesRoot(notesRoot, relativePath, requireExisting = false) {
  const segments = sanitizePathSegments(relativePath);
  
  if (!segments || segments.length === 0) {
    throw new Error('Path is required');
  }
  
  const targetPath = path.join(notesRoot, ...segments);
  
  if (requireExisting) {
    if (!fs.existsSync(targetPath)) {
      throw new Error('Path not found');
    }
    
    const resolved = fs.realpathSync(targetPath);
    
    if (!isInsideRoot(resolved, notesRoot)) {
      throw new Error('Path escapes notes root');
    }
    
    return resolved;
  }
  
  // For new paths, validate parent directory exists and is safe
  const parent = path.dirname(targetPath);
  
  if (!fs.existsSync(parent)) {
    // Parent doesn't exist, check if we can create it
    const resolvedParent = path.normalize(parent);
    if (!isInsideRoot(resolvedParent, notesRoot)) {
      throw new Error('Invalid target parent path');
    }
  } else {
    const resolvedParent = fs.realpathSync(parent);
    if (!isInsideRoot(resolvedParent, notesRoot)) {
      throw new Error('Invalid target parent path');
    }
  }
  
  return targetPath;
}

/**
 * Get relative path from notes root
 */
export function getRelativePath(notesRoot, fullPath) {
  return path.relative(notesRoot, fullPath).replace(/\\/g, '/');
}
