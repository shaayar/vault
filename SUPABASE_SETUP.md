# Supabase Migration Setup Guide

This guide walks you through setting up VaultNote with Supabase backend.

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier is sufficient)
- Git repository for your project

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up/login with GitHub/GitLab/Email
4. Click "New Project"
5. Choose your organization
6. Enter project details:
   - **Project Name**: `vaultnote` (or your preference)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
7. Click "Create new project"
8. Wait for project to be created (2-3 minutes)

## Step 2: Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** from the sidebar
3. Click **"New query"**
4. Copy the contents of `supabase/migrations/001_initial_schema.sql`
5. Paste into the SQL editor
6. Click **"Run"** to execute the schema

## Step 3: Set Up Storage Bucket

1. Navigate to **Storage** from the sidebar
2. Click **"Create bucket"**
3. Enter bucket details:
   - **Bucket name**: `vault-images`
   - **Public bucket**: Yes (for image serving)
4. Click **"Save"**

## Step 4: Get API Keys

1. Navigate to **Project Settings** > **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ...`)

## Step 5: Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Replace with your actual values from Step 4.

## Step 6: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Step 7: Test the Connection

Run the development server:

```bash
npm run dev
```

Open your browser and check the console for any Supabase connection errors.

## Step 8: Update Components

The migration includes updated components that use Supabase:

### Authentication
- Replace `useAuth` hook with `useSupabaseAuth`
- Update login/signup components

### API Layer
- All API calls now use Supabase client
- Vault operations use vault_id instead of vault names

### Storage
- Images are stored in Supabase Storage
- Public URLs are generated automatically

## Step 9: Deploy to Vercel (Frontend)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Click "Deploy"

## Step 10: Deploy to Netlify (Backend/Edge)

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" > "Import an existing project"
3. Connect to your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add environment variables (same as Vercel)
6. Click "Deploy site"

## Migration Checklist

- [ ] Supabase project created
- [ ] Database schema applied
- [ ] Storage bucket created
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Local development tested
- [ ] Components updated for Supabase
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Netlify

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure `.env.local` is created and contains both variables
   - Restart development server after adding variables

2. **"Row Level Security policy violation"**
   - Check that RLS policies are correctly applied
   - Verify user is authenticated

3. **"Storage bucket not found"**
   - Ensure bucket name matches exactly (`vault-images`)
   - Check bucket is set to public

4. **"CORS errors"**
   - Add your Vercel domain to Supabase CORS settings
   - Go to Project Settings > API > CORS

### Debug Tips

- Check browser console for detailed error messages
- Use Supabase Dashboard > Database > Logs for SQL errors
- Verify API keys are correctly copied (no extra spaces)

## Next Steps

After migration is complete:

1. Test all vault operations (create, delete, rename)
2. Test note operations (create, edit, delete)
3. Test image uploads
4. Test authentication flow
5. Enable real-time features (future enhancement)

## Benefits Achieved

- ✅ Scalable PostgreSQL backend
- ✅ Proper authentication system
- ✅ Secure file storage
- ✅ Real-time ready architecture
- ✅ Professional deployment setup
- ✅ Cost-effective (free tier sufficient for most users)
