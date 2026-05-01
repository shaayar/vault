-- Initial VaultNote Schema
-- This migration creates the core database structure for VaultNote

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vaults table
CREATE TABLE vaults (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id, name)
);

-- Notes table
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE NOT NULL,
  path TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  frontmatter JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vault_id, path)
);

-- Folders table (for structure)
CREATE TABLE folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE NOT NULL,
  path TEXT NOT NULL,
  parent_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vault_id, path)
);

-- Images table (references Supabase Storage)
CREATE TABLE images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vault_id, filename)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for vaults
CREATE POLICY "Users can manage own vaults" ON vaults
  FOR ALL USING (auth.uid() = owner_id);

-- RLS Policies for notes
CREATE POLICY "Users can manage own vault notes" ON notes
  FOR ALL USING (
    vault_id IN (SELECT id FROM vaults WHERE owner_id = auth.uid())
  );

-- RLS Policies for folders
CREATE POLICY "Users can manage own vault folders" ON folders
  FOR ALL USING (
    vault_id IN (SELECT id FROM vaults WHERE owner_id = auth.uid())
  );

-- RLS Policies for images
CREATE POLICY "Users can manage own vault images" ON images
  FOR ALL USING (
    vault_id IN (SELECT id FROM vaults WHERE owner_id = auth.uid())
  );

-- Create indexes for better performance
CREATE INDEX idx_vaults_owner_id ON vaults(owner_id);
CREATE INDEX idx_notes_vault_id ON notes(vault_id);
CREATE INDEX idx_notes_path ON notes(vault_id, path);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX idx_folders_vault_id ON folders(vault_id);
CREATE INDEX idx_folders_path ON folders(vault_id, path);
CREATE INDEX idx_images_vault_id ON images(vault_id);

-- Function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vaults_updated_at
  BEFORE UPDATE ON vaults
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
