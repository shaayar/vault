import express from 'express';
import fs from 'fs';
import path from 'path';
import { getVaultRoot, getNotesRoot } from '../utils/paths.js';
import { sanitizeName } from '../utils/security.js';
import { isInsideRoot } from '../utils/security.js';
import { recursiveDelete } from '../utils/fileOperations.js';
import { sendJson, successResponse, errorResponse } from '../utils/response.js';

const router = express.Router();

// GET /vaults - List all vaults
router.get('/', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const entries = fs.readdirSync(vaultRoot, { withFileTypes: true });
    
    const vaults = [];
    
    for (const entry of entries) {
      if (entry.name === '.' || entry.name === '..') continue;
      
      const cleanName = sanitizeName(entry.name);
      if (cleanName === '') continue;
      
      const fullPath = path.join(vaultRoot, cleanName);
      
      if (!entry.isDirectory()) continue;
      
      let resolved;
      try {
        resolved = fs.realpathSync(fullPath);
      } catch (err) {
        continue;
      }
      
      if (!isInsideRoot(resolved, vaultRoot)) continue;
      
      vaults.push(cleanName);
    }
    
    // Sort naturally, case-insensitive
    vaults.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }));
    
    sendJson(res, 200, successResponse(vaults));
  } catch (err) {
    sendJson(res, 500, errorResponse(err.message || 'Failed to read vault directory'));
  }
});

// POST /vaults - Create a new vault
router.post('/', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const vaultName = sanitizeName(req.body.name || '');
    
    if (vaultName === '') {
      return sendJson(res, 400, errorResponse('Vault name is required'));
    }
    
    const vaultPath = path.join(vaultRoot, vaultName);
    
    if (fs.existsSync(vaultPath)) {
      return sendJson(res, 400, errorResponse(`Vault '${vaultName}' already exists`));
    }
    
    // Create vault directory
    try {
      fs.mkdirSync(vaultPath, { recursive: true, mode: 0o775 });
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to create vault'));
    }
    
    // Create notes subdirectory
    const notesPath = path.join(vaultPath, 'notes');
    try {
      fs.mkdirSync(notesPath, { recursive: true, mode: 0o775 });
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to initialize vault notes directory'));
    }
    
    // Create meta.json
    const metaPath = path.join(vaultPath, 'meta.json');
    const metaPayload = {
      name: vaultName,
      created_at: new Date().toISOString(),
      pinned_notes: []
    };
    
    fs.writeFileSync(metaPath, JSON.stringify(metaPayload, null, 2), 'utf-8');
    
    // Create welcome note
    const welcomeNotePath = path.join(notesPath, 'Welcome.md');
    console.log(`Creating welcome note at: ${welcomeNotePath}`);
    const welcomeContent = `---
title: "Welcome to VaultNote"
tags: [welcome, getting-started]
created: ${new Date().toISOString()}
---

# Welcome to VaultNote

This is your new vault. Here are some quick tips to get started:

## Creating Notes

- Right-click on folders to create new notes
- Use the **New note** option in the context menu
- Notes are stored as Markdown files

## Organizing with Folders

- Create folders to organize your notes
- Drag and drop to move notes between folders
- Use the sidebar to navigate your vault

## Wiki Links

- Use \`[[Note Name]]\` to link to other notes
- Click on wiki links to navigate between notes
- The graph view shows all note connections

## Keyboard Shortcuts

- \`Ctrl+S\` - Save note
- \`Ctrl+E\` - Edit mode
- \`Ctrl+P\` - Preview mode
- \`Ctrl+Shift+E\` - Split view
- \`Ctrl+K\` - Search
- \`Ctrl+G\` - Graph view

Happy note-taking! 📝
`;

    fs.writeFileSync(welcomeNotePath, welcomeContent, 'utf-8');
    console.log(`Welcome note created successfully`);
    
    sendJson(res, 201, successResponse(vaultName));
  } catch (err) {
    sendJson(res, 500, errorResponse(err.message || 'Failed to create vault'));
  }
});

// DELETE /vaults/:vaultName - Delete a vault
router.delete('/:vaultName', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const vaultName = sanitizeName(req.params.vaultName);
    
    if (vaultName === '') {
      return sendJson(res, 400, errorResponse('Invalid vault name'));
    }
    
    const vaultPath = path.join(vaultRoot, vaultName);
    
    if (!fs.existsSync(vaultPath) || !fs.statSync(vaultPath).isDirectory()) {
      return sendJson(res, 404, errorResponse(`Vault '${vaultName}' not found`));
    }
    
    // Recursively delete vault directory
    try {
      recursiveDelete(vaultPath);
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to delete vault directory'));
    }
    
    sendJson(res, 200, successResponse({ deleted: vaultName }));
  } catch (err) {
    sendJson(res, 500, errorResponse(err.message || 'Failed to delete vault'));
  }
});

// PATCH /vaults/:vaultName - Rename a vault
router.patch('/:vaultName', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const oldVaultName = sanitizeName(req.params.vaultName);
    
    if (oldVaultName === '') {
      return sendJson(res, 400, errorResponse('Invalid vault name'));
    }
    
    const newVaultName = sanitizeName(req.body.name || '');
    
    if (newVaultName === '') {
      return sendJson(res, 400, errorResponse('New vault name is required'));
    }
    
    if (oldVaultName === newVaultName) {
      return sendJson(res, 200, successResponse({ name: newVaultName }));
    }
    
    const oldVaultPath = path.join(vaultRoot, oldVaultName);
    const newVaultPath = path.join(vaultRoot, newVaultName);
    
    if (!fs.existsSync(oldVaultPath) || !fs.statSync(oldVaultPath).isDirectory()) {
      return sendJson(res, 404, errorResponse(`Vault '${oldVaultName}' not found`));
    }
    
    if (fs.existsSync(newVaultPath)) {
      return sendJson(res, 400, errorResponse(`Vault '${newVaultName}' already exists`));
    }
    
    try {
      fs.renameSync(oldVaultPath, newVaultPath);
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to rename vault'));
    }
    
    // Update meta.json with new name
    const metaPath = path.join(newVaultPath, 'meta.json');
    if (fs.existsSync(metaPath)) {
      try {
        const metaContent = fs.readFileSync(metaPath, 'utf-8');
        const meta = JSON.parse(metaContent);
        meta.name = newVaultName;
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
      } catch (err) {
        // Non-fatal: continue even if meta update fails
      }
    }
    
    sendJson(res, 200, successResponse({ name: newVaultName }));
  } catch (err) {
    sendJson(res, 500, errorResponse(err.message || 'Failed to rename vault'));
  }
});

export default router;
