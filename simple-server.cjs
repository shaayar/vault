const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = 8000;

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

  console.log(`Request: ${req.method} ${requestPath}`);

  if (requestPath === '/api/vaults') {
    // Return demo vault
    const response = {
      success: true,
      data: ['demo-vault']
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
    return;
  }

  if (requestPath === '/api/vaults/demo-vault/notes') {
    // Return demo folder structure
    const response = {
      success: true,
      data: {
        path: '',
        name: 'Root',
        folders: [
          {
            path: 'projects',
            name: 'projects',
            folders: [],
            files: [
              {
                path: 'projects/Project Roadmap.md',
                name: 'Project Roadmap.md',
                title: 'Project Roadmap',
                content: '# Project Roadmap\n\n## Q1 2024 Goals\n- [ ] Complete UI redesign',
                tags: ['planning', 'roadmap', 'projects'],
                created: '2024-01-15',
                updated: '2024-01-20',
                pinned: false
              },
              {
                path: 'projects/Meeting Notes.md',
                name: 'Meeting Notes.md',
                title: 'Meeting Notes - Team Sync',
                content: '# Team Sync Meeting Notes\n\n## Date: January 18, 2024',
                tags: ['meetings', 'team', 'projects'],
                created: '2024-01-18',
                updated: '2024-01-18',
                pinned: false
              }
            ]
          },
          {
            path: 'personal',
            name: 'personal',
            folders: [],
            files: [
              {
                path: 'personal/Daily Journal.md',
                name: 'Daily Journal.md',
                title: 'Daily Journal Entry',
                content: '# Daily Journal - January 19, 2024\n\n## Morning Reflection',
                tags: ['journal', 'personal', 'reflection'],
                created: '2024-01-19',
                updated: '2024-01-19',
                pinned: false
              }
            ]
          },
          {
            path: 'work',
            name: 'work',
            folders: [],
            files: [
              {
                path: 'work/Client Presentation.md',
                name: 'Client Presentation.md',
                title: 'Client Presentation Prep',
                content: '# Client Presentation Preparation\n\n## Client: TechCorp Solutions',
                tags: ['work', 'presentation', 'client'],
                created: '2024-01-17',
                updated: '2024-01-19',
                pinned: false
              }
            ]
          },
          {
            path: 'ideas',
            name: 'ideas',
            folders: [],
            files: [
              {
                path: 'ideas/App Feature Ideas.md',
                name: 'App Feature Ideas.md',
                title: 'App Feature Ideas',
                content: '# App Feature Ideas\n\n## Core Features\n- [ ] Real-time collaboration',
                tags: ['ideas', 'features', 'brainstorming'],
                created: '2024-01-16',
                updated: '2024-01-19',
                pinned: false
              }
            ]
          }
        ],
        files: []
      }
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
    return;
  }

  // Handle POST requests for creating notes
  if (requestPath.startsWith('/api/vaults/demo-vault/notes/') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { content } = JSON.parse(body);
        const notePath = decodeURIComponent(requestPath.replace('/api/vaults/demo-vault/notes/', ''));

        // Create the file on disk
        const fullPath = path.join(__dirname, 'vaults/demo-vault/notes', notePath);
        const dir = path.dirname(fullPath);

        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Write the note file
        fs.writeFileSync(fullPath, content, 'utf8');

        const response = { success: true, data: { path: notePath } };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        console.log(`Created note: ${notePath}`);
      } catch (error) {
        console.error('Error creating note:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Failed to create note' }));
      }
    });
    return;
  }

  // Handle note content requests
  if (requestPath.startsWith('/api/vaults/demo-vault/notes/') && req.method === 'GET') {
    const notePath = decodeURIComponent(requestPath.replace('/api/vaults/demo-vault/notes/', ''));
    const noteFiles = {
      'projects/Project Roadmap.md': fs.readFileSync(path.join(__dirname, 'vaults/demo-vault/notes/projects/Project Roadmap.md'), 'utf8'),
      'projects/Meeting Notes.md': fs.readFileSync(path.join(__dirname, 'vaults/demo-vault/notes/projects/Meeting Notes.md'), 'utf8'),
      'personal/Daily Journal.md': fs.readFileSync(path.join(__dirname, 'vaults/demo-vault/notes/personal/Daily Journal.md'), 'utf8'),
      'work/Client Presentation.md': fs.readFileSync(path.join(__dirname, 'vaults/demo-vault/notes/work/Client Presentation.md'), 'utf8'),
      'ideas/App Feature Ideas.md': fs.readFileSync(path.join(__dirname, 'vaults/demo-vault/notes/ideas/App Feature Ideas.md'), 'utf8')
    };

    const content = noteFiles[notePath];
    if (content) {
      const response = { success: true, data: { content } };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Note not found' }));
    }
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});
