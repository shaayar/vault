import fs from 'fs';
import path from 'path';
import { sanitizeName, isInsideRoot } from './security.js';
import { getRelativePath } from './paths.js';

/**
 * Build recursive folder tree and note listing.
 */
export function buildTreeNode(folderPath, rootPath) {
  const folderName = path.basename(folderPath);
  const relative = getRelativePath(rootPath, folderPath);
  
  const childrenFolders = [];
  const notes = [];
  
  let entries = [];
  try {
    entries = fs.readdirSync(folderPath, { withFileTypes: true });
  } catch (err) {
    return {
      name: folderName === 'notes' ? 'Root' : folderName,
      path: relative || '.',
      folders: [],
      notes: []
    };
  }
  
  for (const entry of entries) {
    if (entry.name === '.' || entry.name === '..') continue;
    
    const fullPath = path.join(folderPath, entry.name);
    
    if (entry.isDirectory()) {
      childrenFolders.push(buildTreeNode(fullPath, rootPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      const noteRelative = getRelativePath(rootPath, fullPath);
      notes.push({
        name: path.parse(entry.name).name,
        fileName: entry.name,
        path: noteRelative
      });
    }
  }
  
  // Sort folders and notes alphabetically (case-insensitive)
  childrenFolders.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  notes.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  
  return {
    name: folderName === 'notes' ? 'Root' : folderName,
    path: relative || '.',
    folders: childrenFolders,
    notes: notes
  };
}

/**
 * Update or insert a simple title frontmatter field.
 */
export function updateNoteTitleFrontmatter(content, title) {
  // JSON encode the title for proper escaping
  let quotedTitle = JSON.stringify(title);
  
  // Check if content has frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  
  if (frontmatterMatch) {
    let frontmatter = frontmatterMatch[1];
    const body = frontmatterMatch[2] || '';
    
    // Check if title field exists
    if (/^title:\s*.*$/m.test(frontmatter)) {
      // Replace existing title
      frontmatter = frontmatter.replace(/^title:\s*.*$/m, `title: ${quotedTitle}`);
    } else {
      // Add title field
      frontmatter = frontmatter.trim() === ''
        ? `title: ${quotedTitle}`
        : `title: ${quotedTitle}\n${frontmatter}`;
    }
    
    return `---\n${frontmatter.trim()}\n---\n${body.trimStart()}`;
  }
  
  // No frontmatter exists, create new
  return `---\ntitle: ${quotedTitle}\n---\n\n${content}`;
}

/**
 * Rename a note and keep its title metadata in sync.
 */
export function renameNoteInPlace(notesDir, resolvedNote, newName) {
  const cleanName = sanitizeName(newName);
  
  if (cleanName === '') {
    throw new Error('New note name is required');
  }
  
  const targetDir = path.dirname(resolvedNote);
  const targetPath = path.join(targetDir, `${cleanName}.md`);
  
  if (fs.existsSync(targetPath)) {
    throw new Error('Target note already exists');
  }
  
  let content;
  try {
    content = fs.readFileSync(resolvedNote, 'utf-8');
  } catch (err) {
    throw new Error('Failed to read note');
  }
  
  const updatedContent = updateNoteTitleFrontmatter(content, cleanName);
  
  try {
    fs.renameSync(resolvedNote, targetPath);
    fs.writeFileSync(targetPath, updatedContent, 'utf-8');
  } catch (err) {
    throw new Error('Failed to rename note');
  }
  
  return getRelativePath(notesDir, targetPath);
}

/**
 * Rename a folder within the notes tree.
 */
export function renameFolderInPlace(notesDir, resolvedFolder, newName) {
  const cleanName = sanitizeName(newName);
  
  if (cleanName === '') {
    throw new Error('New folder name is required');
  }
  
  const targetDir = path.dirname(resolvedFolder);
  const targetPath = path.join(targetDir, cleanName);
  
  if (fs.existsSync(targetPath)) {
    throw new Error('Target folder already exists');
  }
  
  try {
    fs.renameSync(resolvedFolder, targetPath);
  } catch (err) {
    throw new Error('Failed to rename folder');
  }
  
  return getRelativePath(notesDir, targetPath);
}

/**
 * Recursively delete a directory and all its contents
 */
export function recursiveDelete(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      recursiveDelete(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }
  
  fs.rmdirSync(dirPath);
}
