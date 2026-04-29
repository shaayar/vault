import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { getVaultRoot } from '../utils/paths.js';
import { sanitizeName } from '../utils/security.js';
import { sendJson, successResponse, errorResponse } from '../utils/response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router({ mergeParams: true });

// Configure multer for memory storage (we'll write to disk manually)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type'), false);
    }
  }
});

// POST /vaults/:vaultName/images/upload - Upload an image
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return sendJson(res, 400, errorResponse('No valid image file uploaded'));
    }
    
    const vaultRoot = getVaultRoot();
    const vaultName = sanitizeName(req.params.vaultName);
    
    if (vaultName === '') {
      return sendJson(res, 400, errorResponse('Invalid vault name'));
    }
    
    const vaultPath = path.join(vaultRoot, vaultName);
    
    if (!fs.existsSync(vaultPath) || !fs.statSync(vaultPath).isDirectory()) {
      return sendJson(res, 404, errorResponse('Vault not found'));
    }
    
    const imagesDir = path.join(vaultPath, 'images');
    
    if (!fs.existsSync(imagesDir)) {
      try {
        fs.mkdirSync(imagesDir, { recursive: true, mode: 0o775 });
      } catch (err) {
        return sendJson(res, 500, errorResponse('Failed to create images directory'));
      }
    }
    
    // Generate unique filename
    const extension = path.extname(req.file.originalname) || '.jpg';
    const timestamp = Date.now();
    const randomBytes = Math.random().toString(36).substring(2, 10);
    const filename = `img_${timestamp}_${randomBytes}${extension}`;
    const targetPath = path.join(imagesDir, filename);
    
    try {
      fs.writeFileSync(targetPath, req.file.buffer);
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to save image'));
    }
    
    const imageUrl = `/vaults/${encodeURIComponent(vaultName)}/images/${encodeURIComponent(filename)}`;
    
    sendJson(res, 201, successResponse({ url: imageUrl }));
  } catch (err) {
    if (err.message === 'Invalid image type') {
      return sendJson(res, 400, errorResponse('Invalid image type'));
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendJson(res, 400, errorResponse('Image too large (max 10MB)'));
    }
    sendJson(res, 500, errorResponse(err.message || 'Failed to upload image'));
  }
});

// GET /vaults/:vaultName/images/:filename - Serve an image
router.get('/:filename', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const vaultName = sanitizeName(req.params.vaultName);
    
    if (vaultName === '') {
      return sendJson(res, 400, errorResponse('Invalid vault name'));
    }
    
    const filename = sanitizeName(req.params.filename);
    
    if (filename === '') {
      return sendJson(res, 400, errorResponse('Invalid filename'));
    }
    
    const vaultPath = path.join(vaultRoot, vaultName);
    const imagesDir = path.join(vaultPath, 'images');
    const targetPath = path.join(imagesDir, filename);
    
    if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
      return sendJson(res, 404, errorResponse('Image not found'));
    }
    
    // Determine content type based on extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    const stream = fs.createReadStream(targetPath);
    stream.pipe(res);
    
    stream.on('error', (err) => {
      sendJson(res, 500, errorResponse('Failed to read image'));
    });
  } catch (err) {
    sendJson(res, 500, errorResponse(err.message || 'Failed to serve image'));
  }
});

// DELETE /vaults/:vaultName/images/:filename - Delete an image
router.delete('/:filename', (req, res) => {
  try {
    const vaultRoot = getVaultRoot();
    const vaultName = sanitizeName(req.params.vaultName);
    
    if (vaultName === '') {
      return sendJson(res, 400, errorResponse('Invalid vault name'));
    }
    
    const filename = sanitizeName(req.params.filename);
    
    if (filename === '') {
      return sendJson(res, 400, errorResponse('Invalid filename'));
    }
    
    const vaultPath = path.join(vaultRoot, vaultName);
    const imagesDir = path.join(vaultPath, 'images');
    const targetPath = path.join(imagesDir, filename);
    
    if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
      return sendJson(res, 404, errorResponse('Image not found'));
    }
    
    try {
      fs.unlinkSync(targetPath);
    } catch (err) {
      return sendJson(res, 500, errorResponse('Failed to delete image'));
    }
    
    sendJson(res, 200, successResponse({ deleted: true }));
  } catch (err) {
    sendJson(res, 500, errorResponse(err.message || 'Failed to delete image'));
  }
});

export default router;
