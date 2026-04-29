import express from 'express';
import fs from 'fs';
import path from 'path';
import { getVaultRoot, getNotesRoot, resolveUnderNotesRoot } from '../utils/paths.js';
import { isInsideRoot } from '../utils/security.js';
import { sendJson, successResponse, errorResponse } from '../utils/response.js';

const router = express.Router({ mergeParams: true });

// POST /vaults/:vaultName/notes/*/move - Move a note
router.post('/notes/*/move', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const notesDir = getNotesRoot(vaultRoot, req.params.vaultName);
    const notePath = req.params[0];
    
    const resolvedNote = resolveUnderNotesRoot(notesDir, notePath, true);
    
    if (!fs.existsSync(resolvedNote) || !fs.statSync(resolvedNote).isFile() ||
        !resolvedNote.toLowerCase().endsWith('.md')) {
      return sendJson(res, 404, errorResponse('Note not found'));
    }
    
    const targetPath = req.body.targetPath || '';
    
    if (targetPath === '') {
      return sendJson(res, 400, errorResponse('Target path is required'));
    }
    
    const resolvedTarget = resolveUnderNotesRoot(notesDir, targetPath, false);
    const targetDir = path.dirname(resolvedTarget);
    
    let resolvedTargetDir;
    try {
      resolvedTargetDir = fs.realpathSync(targetDir);
    } catch (err) {
      // Target directory doesn't exist yet, use normalized path
      resolvedTargetDir = path.normalize(targetDir);
    }
    
    if (!isInsideRoot(resolvedTargetDir, notesDir)) {
      return sendJson(res, 400, errorResponse('Invalid target directory'));
    }
    
    // Ensure target directory exists
    if (!fs.existsSync(resolvedTargetDir)) {
      try {
        fs.mkdirSync(resolvedTargetDir, { recursive: true, mode: 0o775 });
        resolvedTargetDir = fs.realpathSync(resolvedTargetDir);
      } catch (err) {
        return sendJson(res, 500, errorResponse('Failed to create target directory'));
      }
    }
    
    const noteName = path.basename(resolvedNote);
    const finalTarget = path.join(resolvedTargetDir, noteName);
    
    if (fs.existsSync(finalTarget)) {
      return sendJson(res, 400, errorResponse('Target note already exists'));
    }
    
    try {
      fs.renameSync(resolvedNote, finalTarget);
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to move note'));
    }
    
    const newRelativePath = path.relative(notesDir, finalTarget).replace(/\\/g, '/');
    
    sendJson(res, 200, successResponse({ path: newRelativePath }));
  } catch (err) {
    sendJson(res, err.message.includes('not found') ? 404 : 400, errorResponse(err.message));
  }
});

// POST /vaults/:vaultName/folders/*/move - Move a folder
router.post('/folders/*/move', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const notesDir = getNotesRoot(vaultRoot, req.params.vaultName);
    const folderPath = req.params[0];
    
    const resolvedFolder = resolveUnderNotesRoot(notesDir, folderPath, true);
    
    if (!fs.existsSync(resolvedFolder) || !fs.statSync(resolvedFolder).isDirectory()) {
      return sendJson(res, 404, errorResponse('Folder not found'));
    }
    
    const targetPath = req.body.targetPath || '';
    
    if (targetPath === '') {
      return sendJson(res, 400, errorResponse('Target path is required'));
    }
    
    const resolvedTarget = resolveUnderNotesRoot(notesDir, targetPath, false);
    const targetDir = path.dirname(resolvedTarget);
    
    let resolvedTargetDir;
    try {
      resolvedTargetDir = fs.realpathSync(targetDir);
    } catch (err) {
      resolvedTargetDir = path.normalize(targetDir);
    }
    
    if (!isInsideRoot(resolvedTargetDir, notesDir)) {
      return sendJson(res, 400, errorResponse('Invalid target directory'));
    }
    
    // Ensure target directory exists
    if (!fs.existsSync(resolvedTargetDir)) {
      try {
        fs.mkdirSync(resolvedTargetDir, { recursive: true, mode: 0o775 });
        resolvedTargetDir = fs.realpathSync(resolvedTargetDir);
      } catch (err) {
        return sendJson(res, 500, errorResponse('Failed to create target directory'));
      }
    }
    
    const folderName = path.basename(resolvedFolder);
    const finalTarget = path.join(resolvedTargetDir, folderName);
    
    if (fs.existsSync(finalTarget)) {
      return sendJson(res, 400, errorResponse('Target folder already exists'));
    }
    
    // Prevent moving a folder into itself or its subdirectories
    if (finalTarget.startsWith(resolvedFolder + path.sep)) {
      return sendJson(res, 400, errorResponse('Cannot move folder into itself'));
    }
    
    try {
      fs.renameSync(resolvedFolder, finalTarget);
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to move folder'));
    }
    
    const newRelativePath = path.relative(notesDir, finalTarget).replace(/\\/g, '/');
    
    sendJson(res, 200, successResponse({ path: newRelativePath }));
  } catch (err) {
    sendJson(res, err.message.includes('not found') ? 404 : 400, errorResponse(err.message));
  }
});

export default router;
