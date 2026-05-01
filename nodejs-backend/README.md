# VaultNote Node.js Backend

A production-ready Node.js/Express REST API for VaultNote - a filesystem-based note-taking application. This is a 1:1 functional equivalent of the original PHP API.

## Features

- **Filesystem-based storage** - No database required, all data stored in `/vaults/`
- **Complete CRUD operations** for vaults, notes, and folders
- **Security-first design** - Path sanitization, directory traversal protection
- **Image upload support** - Multer-based with type/size validation
- **CORS enabled** - Ready for frontend integration
- **Frontmatter support** - Automatic title synchronization when renaming notes

## Project Structure

```markdown
nodejs-backend/
├── package.json
├── README.md
├── vaults/                    # Storage directory (created on startup)
└── src/
    ├── index.js              # Entry point & middleware setup
    ├── routes/
    │   ├── vaults.js         # Vault CRUD operations
    │   ├── meta.js           # Vault metadata management
    │   ├── notes.js          # Note CRUD operations
    │   ├── folders.js        # Folder operations
    │   ├── move.js           # Move notes/folders
    │   └── images.js         # Image upload/delete
    └── utils/
        ├── response.js       # Response helpers
        ├── security.js       # Path sanitization & validation
        ├── paths.js          # Path resolution helpers
        └── fileOperations.js # File/folder operations
```

## Installation

```bash
# Install dependencies
npm install

# Start development server (with auto-reload on Node 18+)
npm run dev

# Start production server
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |

## API Endpoints

### Vaults

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vaults` | List all vaults |
| POST | `/vaults` | Create new vault |
| DELETE | `/vaults/:vaultName` | Delete vault |
| PATCH | `/vaults/:vaultName` | Rename vault |

### Metadata

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vaults/:vaultName/meta` | Get vault metadata |
| PUT | `/vaults/:vaultName/meta` | Update pinned notes |

### Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vaults/:vaultName/notes` | Get folder tree |
| GET | `/vaults/:vaultName/notes/*` | Get note content |
| POST | `/vaults/:vaultName/notes/*` | Create note |
| PUT | `/vaults/:vaultName/notes/*` | Update note |
| PATCH | `/vaults/:vaultName/notes/*` | Rename note |
| DELETE | `/vaults/:vaultName/notes/*` | Delete note |

### Folders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/vaults/:vaultName/folders` | Create folder |
| PATCH | `/vaults/:vaultName/folders/*` | Rename folder |
| DELETE | `/vaults/:vaultName/folders/*` | Delete folder (empty only) |

### Move Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/vaults/:vaultName/notes/*/move` | Move note to folder |
| POST | `/vaults/:vaultName/folders/*/move` | Move folder |

### Images

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/vaults/:vaultName/images/upload` | Upload image (multipart/form-data, field: `image`) |
| GET | `/vaults/:vaultName/images/:filename` | Serve image |
| DELETE | `/vaults/:vaultName/images/:filename` | Delete image |

## Response Format

All responses follow this consistent format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Security Features

- **Directory traversal protection** - All paths validated against root boundaries
- **Path sanitization** - Removes null bytes, slashes, and invalid characters
- **File type restrictions** - Only `.md` files allowed for notes
- **Image validation** - MIME type checking and 10MB size limit
- **Atomic operations** - File writes use temp files where possible

## Local Development

```bash
# Clone the repository
cd nodejs-backend

# Install dependencies
npm install

# Start the server
npm run dev

# Test the API
curl http://localhost:3000/vaults
```

## Deploy on Render

### Web Service Deployment

1. **Create a new Web Service** on Render
2. **Connect your repository** or use "Deploy from Git"
3. **Configure settings:**
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** `NODE_ENV=production`

4. **Add environment variables** (optional):
   - `PORT` - Render sets this automatically (default: 10000)
   - `NODE_ENV=production`

5. **Deploy**

### Render Blueprint (render.yaml)

Create a `render.yaml` file in your repo:

```yaml
services:
  - type: web
    name: vaultnote-api
    runtime: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
    disk:
      name: vaults-data
      mountPath: /opt/render/project/src/vaults
      sizeGB: 1
```

### Important for Render Deployment

The `vaults/` directory is created automatically at startup. On Render with ephemeral disks, data persists for the lifetime of the instance. For persistent storage:

1. **Use Render Disks** (as shown in blueprint above) for persistent filesystem storage
2. **Or** configure external storage (S3, etc.) and modify `src/utils/paths.js`

## Migration from PHP API

This Node.js backend is a **1:1 functional equivalent** of the PHP API. All endpoints, request/response formats, and behaviors are preserved:

- Same URL structure
- Same JSON response format
- Same path sanitization rules
- Same security validations
- Same frontmatter handling

Simply point your frontend to the new Node.js server instead of the PHP endpoint.

## License

MIT
