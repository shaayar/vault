# VaultNote Deployment Guide

This guide covers deployment options for VaultNote, which consists of:

- **Frontend**: React 19 + Vite 8 + Tailwind 4
- **Backend**: PHP 8+ API (single entry `api/index.php`)
- **Data**: Local-first, stored in `vaults/` directory

---

## Option 1: Backend on Render + Frontend on Vercel (Recommended)

### Backend Deployment (Render)

#### 1. Prepare for Render

Create a `render.yaml` file in your project root:

```yaml
services:
  - type: web
    name: vaultnote-api
    runtime: docker
    plan: free
    dockerfilePath: ./Dockerfile
    envVars:
      - key: APP_ENV
        value: production
    disk:
      name: vaults
      mountPath: /var/www/vaults
      sizeGB: 10
```

Also create a `Dockerfile`:

```dockerfile
FROM php:8.2-apache

RUN a2enmod rewrite

WORKDIR /var/www/html

COPY api/ ./api/

RUN echo '<VirtualHost *:80>\
    DocumentRoot /var/www/html\
    <Directory /var/www/html/api>\
        AllowOverride All\
        Require all granted\
    </Directory>\
</VirtualHost>' > /etc/apache2/sites-available/000-default.conf

EXPOSE 80
CMD ["apache2-foreground"]
```

#### 2. Create `.htaccess` for Apache routing

Ensure `api/.htaccess` exists for proper routing:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

#### 3. Deploy to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: vaultnote-api
   - **Region**: Choose nearest to your users
   - **Branch**: main
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile`
6. **Important - Add Disk Storage**:
   - Scroll to "Advanced" → "Disk"
   - Mount path: `/var/www/vaults`
   - Size: 10 GB (or as needed)
7. Click "Deploy Web Service"

#### 4. Get your API URL

After deployment, Render will give you a URL like:

```text
https://vaultnote-api.onrender.com
```

### Frontend Deployment (Vercel)

#### 1. Configure Environment Variables

Create `.env.production`:

```env
VITE_API_BASE_URL=https://vaultnote-api.onrender.com/api
```

#### 2. Deploy to Vercel

**Option A: Via Vercel CLI**

```bash
npm install -g vercel
vercel login
vercel
```

**Option B: Via Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://vaultnote-api.onrender.com/api`
6. Click "Deploy"

#### 3. Update Vite Config for Production

Ensure `vite.config.js` has the proxy configured correctly:

```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  }
})
```

Note: The proxy is only for development. In production, `VITE_API_BASE_URL` is used directly.

---

## Environment Variables Reference

### Development (.env)

```env
VITE_API_BASE_URL=/api
```

### Production (.env.production)

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

---

## Important Considerations

### 1. File Storage (vaults/)

**Render**: Uses persistent disk storage

- Free tier: 10 GB
- Paid: Up to 1 TB

### 2. CORS Configuration

If frontend and backend are on different domains, add CORS headers to `api/index.php`:

```php
header("Access-Control-Allow-Origin: https://your-frontend-domain.com");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH");
header("Access-Control-Allow-Headers: Content-Type");
```

### 3. Security

- **Authentication**: Add user authentication to PHP API
- **HTTPS**: Enable SSL (free on Render)
- **Input Validation**: Sanitize all user inputs in PHP
- **Rate Limiting**: Add rate limiting to API endpoints

### 4. Backups

**Render**: Automatic daily backups (paid plans)

**Manual Backup Script**:

```bash
#!/bin/bash
tar -czf vaults-backup-$(date +%Y%m%d).tar.gz vaults/
```

---

## Troubleshooting

### Issue: API returns 404

**Check:**

1. Apache rewrite rules in `.htaccess`
2. `api/index.php` routing logic
3. File permissions

### Issue: Frontend can't connect to API

**Check:**

1. `VITE_API_BASE_URL` is set correctly
2. CORS headers are configured
3. API is accessible (test with curl)

### Issue: Notes not saving

**Check:**

1. `vaults/` directory has write permissions
2. Disk storage is mounted (Render)
3. PHP has file system access

---

## Cost Comparison

| Platform | Free Tier | Paid Tier | Notes |
|----------|-----------|-----------|-------|
| Render (API) | 750 hours/month | $7/month | 10GB disk free |
| Vercel (Frontend) | Unlimited | $20/month | Edge caching |
| Shared Hosting | None | $3-5/month | Cheapest overall |

---

## Recommended Setup

**For production use:**

- **Backend**: Render (Free tier, upgrade if needed)
- **Frontend**: Vercel (Free tier)
- **Total Cost**: $0/month (free tiers)

---

## Quick Start Commands

```bash
# Build for production
npm run build

# Test production build locally
npm run preview

# Deploy to Vercel
vercel --prod

# Deploy to Render (via git)
git push origin main
```

---

## Additional Resources

- [Render PHP Documentation](https://render.com/docs/php)
- [Vercel React Deployment](https://vercel.com/docs/frameworks/react)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
