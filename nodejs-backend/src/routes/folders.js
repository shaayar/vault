import express from 'express';
import fs from 'fs';
import path from 'path';
import { getVaultRoot, getNotesRoot, resolveUnderNotesRoot } from '../utils/paths.js';
import { renameFolderInPlace } from '../utils/fileOperations.js';
import { isInsideRoot } from '../utils/security.js';
import { sendJson, successResponse, errorResponse } from '../utils/response.js';

const router = express.Router({ mergeParams: true });

// POST /vaults/:vaultName/folders - Create a new folder
router.post('/', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const notesDir = getNotesRoot(vaultRoot, req.params.vaultName);
    const folderPath = req.body.path || '';
    
    const targetFolder = resolveUnderNotesRoot(notesDir, folderPath, false);
    
    if (fs.existsSync(targetFolder)) {
      return sendJson(res, 400, errorResponse('Folder already exists'));
    }
    
    const parentDir = path.dirname(targetFolder);
    
    // Create parent directories if needed
    if (!fs.existsSync(parentDir)) {
      try {
        fs.mkdirSync(parentDir, { recursive: true, mode: 0o775 });
      } catch (err) {
        return sendJson(res, 500, errorResponse('Failed to create parent directory'));
      }
    }
    
    // Create the target folder
    try {
      fs.mkdirSync(targetFolder, { recursive: true, mode: 0o775 });
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to create folder'));
    }
    
    // Verify folder was created
    if (!fs.existsSync(targetFolder) || !fs.statSync(targetFolder).isDirectory()) {
      return sendJson(res, 500, errorResponse('Failed to create folder'));
    }
    
    sendJson(res, 201, successResponse({ path: folderPath }));
  } catch (err) {
    sendJson(res, err.message.includes('not found') ? 404 : 400, errorResponse(err.message));
  }
});

// PATCH /vaults/:vaultName/folders/* - Rename a folder
router.patch('/*', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const notesDir = getNotesRoot(vaultRoot, req.params.vaultName);
    const folderPath = req.params[0];
    
    const resolvedFolder = resolveUnderNotesRoot(notesDir, folderPath, true);
    
    if (!fs.existsSync(resolvedFolder) || !fs.statSync(resolvedFolder).isDirectory()) {
      return sendJson(res, 404, errorResponse('Folder not found'));
    }
    
    const newName = req.body.name || '';
    const renamedPath = renameFolderInPlace(notesDir, resolvedFolder, newName);
    
    sendJson(res, 200, successResponse({ path: renamedPath }));
  } catch (err) {
    const status = err.message.includes('not found') ? 404 :
                   err.message.includes('already exists') ? 400 : 500;
    sendJson(res, status, errorResponse(err.message));
  }
});

// DELETE /vaults/:vaultName/folders/* - Delete a folder (must be empty)
router.delete('/*', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const notesDir = getNotesRoot(vaultRoot, req.params.vaultName);
    const folderPath = req.params[0];
    
    const targetFolder = resolveUnderNotesRoot(notesDir, folderPath, true);
    
    if (!fs.existsSync(targetFolder) || !fs.statSync(targetFolder).isDirectory()) {
      return sendJson(res, 404, errorResponse('Folder not found'));
    }
    
    // Check if folder is empty (only . and .. entries)
    let contents;
    try {
      contents = fs.readdirSync(targetFolder);
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to inspect folder'));
    }
    
    if (contents.length > 0) {
      return sendJson(res, 400, errorResponse('Folder is not empty'));
    }
    
    try {
      fs.rmdirSync(targetFolder);
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to delete folder'));
    }
    
    sendJson(res, 200, successResponse({ path: folderPath }));
  } catch (err) {
    sendJson(res, err.message.includes('not found') ? 404 : 400, errorResponse(err.message));
  }
});

export default router;
