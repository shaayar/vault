import express from 'express';
import fs from 'fs';
import path from 'path';
import { getVaultRoot } from '../utils/paths.js';
import { sanitizeName, sanitizePathSegments } from '../utils/security.js';
import { sendJson, successResponse, errorResponse } from '../utils/response.js';

const router = express.Router({ mergeParams: true });

// GET /vaults/:vaultName/meta - Get vault metadata
router.get('/', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const vaultName = sanitizeName(req.params.vaultName);
    
    if (vaultName === '') {
      return sendJson(res, 400, errorResponse('Invalid vault name'));
    }
    
    const metaPath = path.join(vaultRoot, vaultName, 'meta.json');
    
    if (!fs.existsSync(metaPath)) {
      return sendJson(res, 404, errorResponse('Vault meta not found'));
    }
    
    let metaContent;
    try {
      metaContent = fs.readFileSync(metaPath, 'utf-8');
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to read vault meta'));
    }
    
    let meta;
    try {
      meta = JSON.parse(metaContent);
    } catch (err) {
      return sendJson(res, 500, errorResponse('Invalid vault meta format'));
    }
    
    sendJson(res, 200, successResponse(meta));
  } catch (err) {
    sendJson(res, 500, errorResponse(err.message || 'Failed to get vault meta'));
  }
});

// PUT /vaults/:vaultName/meta - Update vault metadata (pinned notes)
router.put('/', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const vaultName = sanitizeName(req.params.vaultName);
    
    if (vaultName === '') {
      return sendJson(res, 400, errorResponse('Invalid vault name'));
    }
    
    const metaPath = path.join(vaultRoot, vaultName, 'meta.json');
    
    if (!fs.existsSync(metaPath)) {
      return sendJson(res, 404, errorResponse('Vault meta not found'));
    }
    
    const pinnedNotes = req.body.pinned_notes;
    
    if (!Array.isArray(pinnedNotes)) {
      return sendJson(res, 400, errorResponse('pinned_notes must be an array'));
    }
    
    // Sanitize all pinned notes
    const sanitizedPins = [];
    for (const pin of pinnedNotes) {
      if (typeof pin !== 'string') continue;
      
      const segmentsSafe = sanitizePathSegments(pin);
      if (!segmentsSafe || segmentsSafe.length === 0) continue;
      
      const candidate = segmentsSafe.join('/');
      if (!candidate.toLowerCase().endsWith('.md')) continue;
      
      sanitizedPins.push(candidate);
    }
    
    // Remove duplicates
    const uniquePins = [...new Set(sanitizedPins)];
    
    // Read current meta
    let current;
    try {
      current = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    } catch (err) {
      current = {
        name: vaultName,
        created_at: new Date().toISOString()
      };
    }
    
    current.pinned_notes = uniquePins;
    current.updated_at = new Date().toISOString();
    
    try {
      fs.writeFileSync(metaPath, JSON.stringify(current, null, 2), 'utf-8');
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to update vault meta'));
    }
    
    sendJson(res, 200, successResponse(current));
  } catch (err) {
    sendJson(res, 500, errorResponse(err.message || 'Failed to update vault meta'));
  }
});

export default router;
