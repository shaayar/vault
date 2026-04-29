const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = Number(process.env.PORT) || 8000;

// Helper to sanitize names
function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
}

// Helper to ensure vault exists
function ensureVault(vaultName) {
  const vaultPath = path.join(__dirname, 'vaults', vaultName);
  const notesPath = path.join(vaultPath, 'notes');
  const metaPath = path.join(vaultPath, 'meta.json');

  if (!fs.existsSync(vaultPath)) {
    fs.mkdirSync(vaultPath, { recursive: true });
  }
  if (!fs.existsSync(notesPath)) {
    fs.mkdirSync(notesPath, { recursive: true });
  }
  if (!fs.existsSync(metaPath)) {
    fs.writeFileSync(metaPath, JSON.stringify({
      name: vaultName,
      created_at: new Date().toISOString(),
      pinned_notes: []
    }, null, 2));
  }

  return { vaultPath, notesPath, metaPath };
}

// Mock API responses
const mockAPI = {
  // Get vaults
  'GET /api/vaults': () => {
    const vaultsDir = path.join(__dirname, 'vaults');
    if (fs.existsSync(vaultsDir)) {
      const vaults = fs.readdirSync(vaultsDir).filter(item => {
        const itemPath = path.join(vaultsDir, item);
        return fs.statSync(itemPath).isDirectory();
      });
      return { success: true, data: vaults };
    }
    return { success: true, data: ['demo-vault'] };
  },

  // Create vault
  'POST /api/vaults': (body) => {
    const vaultName = sanitizeName(body.name);
    if (!vaultName) {
      return { success: false, error: 'Invalid vault name' };
    }

    const vaultPath = path.join(__dirname, 'vaults', vaultName);
    if (fs.existsSync(vaultPath)) {
      return { success: false, error: 'Vault already exists' };
    }

    ensureVault(vaultName);
    return { success: true, data: vaultName };
  },

  // Get vault tree
  'GET /api/vaults/:vault/notes': (vault) => {
    const vaultPath = path.join(__dirname, 'vaults', vault, 'notes');
    if (!fs.existsSync(vaultPath)) {
      return { success: false, error: 'Vault not found' };
    }

    const getFolderTree = (dirPath, relativePath = '') => {
      const items = fs.readdirSync(dirPath);
      const result = {
        path: relativePath,
        name: relativePath ? relativePath.split('/').pop() : 'Root',
        folders: [],
        files: []
      };

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          result.folders.push(getFolderTree(itemPath, itemRelativePath));
        } else if (item.endsWith('.md')) {
          const content = fs.readFileSync(itemPath, 'utf8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          let metadata = {};

          if (frontmatterMatch) {
            try {
              // Simple YAML parsing for basic metadata
              const frontmatter = frontmatterMatch[1];
              const lines = frontmatter.split('\n');
              lines.forEach(line => {
                const match = line.match(/^(\w+):\s*(.+)$/);
                if (match) {
                  let value = match[2];
                  if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
                  }
                  metadata[match[1]] = value;
                }
              });
            } catch (e) {
              console.error('Error parsing frontmatter:', e);
            }
          }

          result.files.push({
            path: itemRelativePath,
            name: item.replace('.md', ''),
            title: metadata.title || item.replace('.md', ''),
            content: content.replace(/^---\n[\s\S]*?\n---\n/, '').substring(0, 100),
            tags: metadata.tags || [],
            created: metadata.created || new Date().toISOString(),
            updated: metadata.updated || new Date().toISOString(),
            pinned: false
          });
        }
      }

      return result;
    };

    const tree = getFolderTree(vaultPath);
    return { success: true, data: tree };
  },

  // Get note content
  'GET /api/vaults/:vault/notes/:path...': (vault, notePath) => {
    const decodedNotePath = decodeURIComponent(notePath);
    const noteFilePath = path.join(
      __dirname,
      'vaults',
      vault,
      'notes',
      decodedNotePath.endsWith('.md') ? decodedNotePath : `${decodedNotePath}.md`
    );
    if (!fs.existsSync(noteFilePath)) {
      return { success: false, error: 'Note not found' };
    }

    const content = fs.readFileSync(noteFilePath, 'utf8');
    return { success: true, data: { path: decodedNotePath, content } };
  },

  // Create note
  'POST /api/vaults/:vault/notes/:path...': (vault, notePath, body) => {
    const decodedNotePath = decodeURIComponent(notePath);
    const noteFilePath = path.join(
      __dirname,
      'vaults',
      vault,
      'notes',
      decodedNotePath.endsWith('.md') ? decodedNotePath : `${decodedNotePath}.md`
    );

    if (fs.existsSync(noteFilePath)) {
      return { success: false, error: 'Note already exists' };
    }

    const content = body.content || '';
    fs.writeFileSync(noteFilePath, content, 'utf8');
    return { success: true, data: { path: decodedNotePath } };
  },

  // Update note
  'PUT /api/vaults/:vault/notes/:path...': (vault, notePath, body) => {
    const decodedNotePath = decodeURIComponent(notePath);
    const noteFilePath = path.join(
      __dirname,
      'vaults',
      vault,
      'notes',
      decodedNotePath.endsWith('.md') ? decodedNotePath : `${decodedNotePath}.md`
    );

    if (!fs.existsSync(noteFilePath)) {
      return { success: false, error: 'Note not found' };
    }

    const content = body.content || '';
    fs.writeFileSync(noteFilePath, content, 'utf8');
    return { success: true, data: { path: decodedNotePath } };
  },

  // Delete note
  'DELETE /api/vaults/:vault/notes/:path...': (vault, notePath) => {
    const decodedNotePath = decodeURIComponent(notePath);
    const noteFilePath = path.join(
      __dirname,
      'vaults',
      vault,
      'notes',
      decodedNotePath.endsWith('.md') ? decodedNotePath : `${decodedNotePath}.md`
    );

    if (!fs.existsSync(noteFilePath)) {
      return { success: false, error: 'Note not found' };
    }

    fs.unlinkSync(noteFilePath);
    return { success: true, data: { path: decodedNotePath } };
  },

  // Rename note
  'PATCH /api/vaults/:vault/notes/:path...': (vault, notePath, body) => {
    const decodedNotePath = decodeURIComponent(notePath);
    const noteFilePath = path.join(
      __dirname,
      'vaults',
      vault,
      'notes',
      decodedNotePath.endsWith('.md') ? decodedNotePath : `${decodedNotePath}.md`
    );

    if (!fs.existsSync(noteFilePath)) {
      return { success: false, error: 'Note not found' };
    }

    const newName = sanitizeName(body.name);
    if (!newName) {
      return { success: false, error: 'Invalid name' };
    }

    const dirPath = path.dirname(noteFilePath);
    const newFilePath = path.join(dirPath, `${newName}.md`);

    if (fs.existsSync(newFilePath)) {
      return { success: false, error: 'Target already exists' };
    }

    fs.renameSync(noteFilePath, newFilePath);

    // Update frontmatter title
    let content = fs.readFileSync(newFilePath, 'utf8');
    const titleRegex = /^title:\s*.*$/m;
    if (titleRegex.test(content)) {
      content = content.replace(titleRegex, `title: "${newName}"`);
    } else {
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        content = content.replace(
          /^---\n([\s\S]*?)\n---/,
          `---\ntitle: "${newName}"\n$1\n---`
        );
      } else {
        content = `---\ntitle: "${newName}"\n---\n\n${content}`;
      }
    }
    fs.writeFileSync(newFilePath, content, 'utf8');

    const newPath = path.dirname(decodedNotePath) ? `${path.dirname(decodedNotePath)}/${newName}.md` : `${newName}.md`;
    return { success: true, data: { path: newPath } };
  },

  // Get vault metadata
  'GET /api/vaults/:vault/meta': (vault) => {
    const metaPath = path.join(__dirname, 'vaults', vault, 'meta.json');
    if (fs.existsSync(metaPath)) {
      try {
        const metaContent = fs.readFileSync(metaPath, 'utf8');
        const meta = JSON.parse(metaContent);
        return { success: true, data: meta };
      } catch (error) {
        return { success: false, error: 'Invalid vault metadata format' };
      }
    }

    // Return default metadata if meta.json doesn't exist
    return {
      success: true,
      data: {
        name: vault,
        created_at: new Date().toISOString(),
        pinned_notes: [],
        settings: {
          theme: 'dark',
          defaultView: 'split',
          autoSave: true,
          showLineNumbers: true
        }
      }
    };
  },

  // Update vault metadata
  'PUT /api/vaults/:vault/meta': (vault, body) => {
    const metaPath = path.join(__dirname, 'vaults', vault, 'meta.json');
    ensureVault(vault);

    let meta;
    if (fs.existsSync(metaPath)) {
      try {
        const metaContent = fs.readFileSync(metaPath, 'utf8');
        meta = JSON.parse(metaContent);
      } catch (error) {
        return { success: false, error: 'Invalid vault metadata format' };
      }
    } else {
      meta = {
        name: vault,
        created_at: new Date().toISOString(),
        pinned_notes: []
      };
    }

    if (body.pinned_notes && Array.isArray(body.pinned_notes)) {
      meta.pinned_notes = body.pinned_notes;
    }
    meta.updated_at = new Date().toISOString();

    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    return { success: true, data: meta };
  },

  // Create folder
  'POST /api/vaults/:vault/folders': (vault, body) => {
    const folderPath = body.path;
    if (!folderPath) {
      return { success: false, error: 'Folder path is required' };
    }

    const decodedPath = decodeURIComponent(folderPath);
    const folderFullPath = path.join(__dirname, 'vaults', vault, 'notes', decodedPath);

    if (fs.existsSync(folderFullPath)) {
      return { success: false, error: 'Folder already exists' };
    }

    fs.mkdirSync(folderFullPath, { recursive: true });
    return { success: true, data: { path: decodedPath } };
  },

  // Delete folder
  'DELETE /api/vaults/:vault/folders/:path...': (vault, folderPath) => {
    const decodedPath = decodeURIComponent(folderPath);
    const folderFullPath = path.join(__dirname, 'vaults', vault, 'notes', decodedPath);

    if (!fs.existsSync(folderFullPath)) {
      return { success: false, error: 'Folder not found' };
    }

    const contents = fs.readdirSync(folderFullPath);
    if (contents.length > 0) {
      return { success: false, error: 'Folder is not empty' };
    }

    fs.rmdirSync(folderFullPath);
    return { success: true, data: { path: decodedPath } };
  },

  // Rename folder
  'PATCH /api/vaults/:vault/folders/:path...': (vault, folderPath, body) => {
    const decodedPath = decodeURIComponent(folderPath);
    const folderFullPath = path.join(__dirname, 'vaults', vault, 'notes', decodedPath);

    if (!fs.existsSync(folderFullPath)) {
      return { success: false, error: 'Folder not found' };
    }

    const newName = sanitizeName(body.name);
    if (!newName) {
      return { success: false, error: 'Invalid name' };
    }

    const parentPath = path.dirname(folderFullPath);
    const newFolderPath = path.join(parentPath, newName);

    if (fs.existsSync(newFolderPath)) {
      return { success: false, error: 'Target already exists' };
    }

    fs.renameSync(folderFullPath, newFolderPath);

    const newPath = path.dirname(decodedPath) ? `${path.dirname(decodedPath)}/${newName}` : newName;
    return { success: true, data: { path: newPath } };
  }
};

// Create HTTP server
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const requestPath = url.pathname;
  const method = req.method;

  // Helper to read request body
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      body = body ? JSON.parse(body) : {};
    } catch (e) {
      body = {};
    }

    // Route handling
    if (requestPath === '/api/vaults') {
      if (method === 'GET') {
        const response = mockAPI['GET /api/vaults']();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } else if (method === 'POST') {
        const response = mockAPI['POST /api/vaults'](body);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
      }
    } else if (requestPath.startsWith('/api/vaults') && requestPath.endsWith('/notes')) {
      // Get vault tree
      const vault = requestPath.split('/')[3];
      const response = mockAPI['GET /api/vaults/:vault/notes'](vault);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } else if (requestPath.startsWith('/api/vaults/') && requestPath.includes('/notes/') && !requestPath.endsWith('/notes')) {
      // Note operations
      const pathParts = requestPath.split('/');
      const vault = pathParts[3];
      const notePath = pathParts.slice(5).join('/');
      const routeKey = `${method} /api/vaults/:vault/notes/:path...`;

      if (mockAPI[routeKey]) {
        const response = mockAPI[routeKey](vault, notePath, body);
        const statusCode = method === 'POST' ? 201 : 200;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
      }
    } else if (requestPath.startsWith('/api/vaults/') && requestPath.endsWith('/meta')) {
      const vault = requestPath.split('/')[3];
      if (method === 'GET') {
        const response = mockAPI['GET /api/vaults/:vault/meta'](vault);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } else if (method === 'PUT') {
        const response = mockAPI['PUT /api/vaults/:vault/meta'](vault, body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
      }
    } else if (requestPath.startsWith('/api/vaults/') && requestPath.includes('/folders')) {
      const pathParts = requestPath.split('/');
      const vault = pathParts[3];
      const folderPath = pathParts.slice(5).join('/');

      if (method === 'POST' && requestPath.endsWith('/folders')) {
        const response = mockAPI['POST /api/vaults/:vault/folders'](vault, body);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } else if (method === 'DELETE') {
        const response = mockAPI['DELETE /api/vaults/:vault/folders/:path...'](vault, folderPath);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } else if (method === 'PATCH') {
        const response = mockAPI['PATCH /api/vaults/:vault/folders/:path...'](vault, folderPath, body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
      }
    } else {
      // 404 for unknown routes
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Not found' }));
    }
  });
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Mock API server could not start because port ${PORT} is already in use.`);
    console.error(`Stop the existing process or run with a different port, e.g. PORT=8001 npm run mock-api.`);
    process.exit(1);
  }

  throw error;
});

server.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET    /api/vaults');
  console.log('  POST   /api/vaults');
  console.log('  GET    /api/vaults/:vault/notes');
  console.log('  GET    /api/vaults/:vault/notes/:path...');
  console.log('  POST   /api/vaults/:vault/notes/:path...');
  console.log('  PUT    /api/vaults/:vault/notes/:path...');
  console.log('  DELETE /api/vaults/:vault/notes/:path...');
  console.log('  PATCH  /api/vaults/:vault/notes/:path...');
  console.log('  GET    /api/vaults/:vault/meta');
  console.log('  PUT    /api/vaults/:vault/meta');
  console.log('  POST   /api/vaults/:vault/folders');
  console.log('  DELETE /api/vaults/:vault/folders/:path...');
  console.log('  PATCH  /api/vaults/:vault/folders/:path...');
});
