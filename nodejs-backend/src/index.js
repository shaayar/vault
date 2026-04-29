import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import vaultsRouter from './routes/vaults.js';
import metaRouter from './routes/meta.js';
import notesRouter from './routes/notes.js';
import foldersRouter from './routes/folders.js';
import moveRouter from './routes/move.js';
import imagesRouter from './routes/images.js';

import { sendJson, errorResponse } from './utils/response.js';
import { getVaultRoot } from './utils/paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Handle preflight requests
app.options('*', cors());

// JSON body parser
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Initialize vault storage on startup
try {
  const vaultRoot = getVaultRoot();
  console.log(`Vault storage initialized at: ${vaultRoot}`);
} catch (err) {
  console.error('Failed to initialize vault storage:', err.message);
  process.exit(1);
}

// Mount routes
app.use('/vaults', vaultsRouter);
app.use('/vaults/:vaultName/meta', metaRouter);
app.use('/vaults/:vaultName/notes', notesRouter);
app.use('/vaults/:vaultName/folders', foldersRouter);
app.use('/vaults/:vaultName', moveRouter);
app.use('/vaults/:vaultName/images', imagesRouter);

// Static file serving for images (alternative to route-based serving)
// Images can be accessed via /vaults/:vaultName/images/:filename

// Health check endpoint
app.get('/health', (req, res) => {
  sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  sendJson(res, 404, errorResponse('Route not found'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendJson(res, 400, errorResponse('Invalid JSON body'));
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendJson(res, 400, errorResponse('Image too large (max 10MB)'));
  }
  
  sendJson(res, 500, errorResponse(err.message || 'Internal server error'));
});

// Start server
app.listen(PORT, () => {
  console.log(`VaultNote API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
