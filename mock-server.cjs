const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = Number(process.env.PORT) || 8000;

// Mock API responses
const mockAPI = {
  // Get vaults
  '/api/vaults': () => {
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

  // Get vault tree
  '/api/vaults/:vault/notes': (vault) => {
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
  '/api/vaults/:vault/notes/:path...': (vault, notePath) => {
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

  // Route handling
  if (requestPath.startsWith('/api/vaults') && requestPath.endsWith('/notes')) {
    // Get vault tree
    const vault = requestPath.split('/')[3];
    const response = mockAPI['/api/vaults/:vault/notes'](vault);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  } else if (requestPath === '/api/vaults') {
    // Get vaults
    const response = mockAPI['/api/vaults']();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  } else if (requestPath.startsWith('/api/vaults/') && requestPath.includes('/notes/') && !requestPath.endsWith('/notes')) {
    // Get specific note
    const pathParts = requestPath.split('/');
    const vault = pathParts[3];
    const notePath = pathParts.slice(5).join('/');
    const response = mockAPI['/api/vaults/:vault/notes/:path...'](vault, notePath);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  } else {
    // 404 for unknown routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Not found' }));
  }
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
  console.log('  GET /api/vaults');
  console.log('  GET /api/vaults/:vault/notes');
  console.log('  GET /api/vaults/:vault/notes/:path...');
});
