import express from 'express';
import fs from 'fs';
import path from 'path';
import { getVaultRoot, getNotesRoot, resolveUnderNotesRoot } from '../utils/paths.js';
import { buildTreeNode, renameNoteInPlace } from '../utils/fileOperations.js';
import { sendJson, successResponse, errorResponse } from '../utils/response.js';

const router = express.Router({ mergeParams: true });

// GET /vaults/:vaultName/notes - Get full folder tree
router.get('/', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const notesDir = getNotesRoot(vaultRoot, req.params.vaultName);
    const tree = buildTreeNode(notesDir, notesDir);
    sendJson(res, 200, successResponse(tree));
  } catch (err) {
    sendJson(res, err.message.includes('not found') ? 404 : 400, errorResponse(err.message));
  }
});

// GET /vaults/:vaultName/notes/* - Get a specific note
router.get('/*', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const notesDir = getNotesRoot(vaultRoot, req.params.vaultName);
    const notePath = req.params[0];
    console.log(`Fetching note: vault=${req.params.vaultName}, path=${notePath}`)
    
    const resolvedNote = resolveUnderNotesRoot(notesDir, notePath, true);
    console.log(`Resolved note path: ${resolvedNote}`)
    
    if (!fs.existsSync(resolvedNote) || !fs.statSync(resolvedNote).isFile() ||
        !resolvedNote.toLowerCase().endsWith('.md')) {
      console.log(`Note not found at: ${resolvedNote}`)
      return sendJson(res, 404, errorResponse('Note not found'));
    }
    
    let content;
    try {
      content = fs.readFileSync(resolvedNote, 'utf-8');
      console.log(`Note content length: ${content.length}`)
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to read note'));
    }

    const relativePath = path.relative(notesDir, resolvedNote).replace(/\\/g, '/');
    console.log(`Returning note: path=${relativePath}`)

    sendJson(res, 200, successResponse({
      path: relativePath,
      content: content
    }));
  } catch (err) {
    sendJson(res, err.message.includes('not found') ? 404 : 400, errorResponse(err.message));
  }
});

// POST /vaults/:vaultName/notes/* - Create a new note
router.post('/*', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const notesDir = getNotesRoot(vaultRoot, req.params.vaultName);
    const notePath = req.params[0];
    
    const targetNote = resolveUnderNotesRoot(notesDir, notePath, false);
    
    if (!targetNote.toLowerCase().endsWith('.md')) {
      return sendJson(res, 400, errorResponse('Only .md notes are allowed'));
    }
    
    if (fs.existsSync(targetNote)) {
      return sendJson(res, 400, errorResponse('Note already exists'));
    }
    
    // Ensure parent directory exists
    const parentDir = path.dirname(targetNote);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true, mode: 0o775 });
    }
    
    const content = req.body.content || '';
    
    try {
      fs.writeFileSync(targetNote, content, 'utf-8');
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to create note'));
    }
    
    sendJson(res, 201, successResponse({ path: notePath }));
  } catch (err) {
    sendJson(res, err.message.includes('not found') ? 404 : 400, errorResponse(err.message));
  }
});

// PUT /vaults/:vaultName/notes/* - Update a note
router.put('/*', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const notesDir = getNotesRoot(vaultRoot, req.params.vaultName);
    const notePath = req.params[0];
    
    const targetNote = resolveUnderNotesRoot(notesDir, notePath, true);
    
    if (!fs.existsSync(targetNote) || !fs.statSync(targetNote).isFile() ||
        !targetNote.toLowerCase().endsWith('.md')) {
      return sendJson(res, 404, errorResponse('Note not found'));
    }
    
    const content = req.body.content || '';
    
    try {
      fs.writeFileSync(targetNote, content, 'utf-8');
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to update note'));
    }
    
    sendJson(res, 200, successResponse({ path: notePath }));
  } catch (err) {
    sendJson(res, err.message.includes('not found') ? 404 : 400, errorResponse(err.message));
  }
});

// PATCH /vaults/:vaultName/notes/* - Rename a note
router.patch('/*', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const notesDir = getNotesRoot(vaultRoot, req.params.vaultName);
    const notePath = req.params[0];
    
    const resolvedNote = resolveUnderNotesRoot(notesDir, notePath, true);
    
    if (!fs.existsSync(resolvedNote) || !fs.statSync(resolvedNote).isFile() ||
        !resolvedNote.toLowerCase().endsWith('.md')) {
      return sendJson(res, 404, errorResponse('Note not found'));
    }
    
    const newName = req.body.name || '';
    const renamedPath = renameNoteInPlace(notesDir, resolvedNote, newName);
    
    sendJson(res, 200, successResponse({ path: renamedPath }));
  } catch (err) {
    const status = err.message.includes('not found') ? 404 : 
                   err.message.includes('already exists') ? 400 : 500;
    sendJson(res, status, errorResponse(err.message));
  }
});

// DELETE /vaults/:vaultName/notes/* - Delete a note
router.delete('/*', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const notesDir = getNotesRoot(vaultRoot, req.params.vaultName);
    const notePath = req.params[0];
    
    const targetNote = resolveUnderNotesRoot(notesDir, notePath, true);
    
    if (!fs.existsSync(targetNote) || !fs.statSync(targetNote).isFile() ||
        !targetNote.toLowerCase().endsWith('.md')) {
      return sendJson(res, 404, errorResponse('Note not found'));
    }
    
    try {
      fs.unlinkSync(targetNote);
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to delete note'));
    }
    
    sendJson(res, 200, successResponse({ path: notePath }));
  } catch (err) {
    sendJson(res, err.message.includes('not found') ? 404 : 400, errorResponse(err.message));
  }
});

export default router;
