-- Creating complete database schema with all required tables, indexes, and triggers
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'member');
CREATE TYPE space_type AS ENUM ('common', 'personal');
CREATE TYPE item_type AS ENUM ('bookmark', 'note', 'file', 'snippet');
CREATE TYPE edit_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'suspended');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'member',
  status user_status DEFAULT 'pending',
  invite_code TEXT UNIQUE,
  invited_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spaces table
CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type space_type NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366f1',
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  html_snapshot TEXT,
  excerpt TEXT,
  type item_type DEFAULT 'bookmark',
  tags TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Full-text search column
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'D')
  ) STORED
);

-- Attachments table
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revisions table for version history
CREATE TABLE revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  tags TEXT[],
  changed_fields TEXT[] NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Edit requests for common space items
CREATE TABLE edit_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  tags TEXT[],
  reason TEXT,
  status edit_request_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invite codes table
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  used_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_spaces_owner_type ON spaces(owner_id, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_spaces_public ON spaces(is_public) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_space ON categories(space_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_items_space_created ON items(space_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_items_category ON items(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_items_creator ON items(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_items_search_vector ON items USING GIN(search_vector);
CREATE INDEX idx_items_tags ON items USING GIN(tags);
CREATE INDEX idx_items_type_space ON items(type, space_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_attachments_item ON attachments(item_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_revisions_item_created ON revisions(item_id, created_at DESC);
CREATE INDEX idx_edit_requests_status ON edit_requests(status);
CREATE INDEX idx_activity_log_user_created ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_log_resource ON activity_log(resource_type, resource_id);
CREATE INDEX idx_invite_codes_code ON invite_codes(code);

-- Materialized view for optimized search
CREATE MATERIALIZED VIEW item_search_view AS
SELECT 
  i.id,
  i.title,
  i.content,
  i.url,
  i.excerpt,
  i.type,
  i.tags,
  i.is_favorite,
  i.created_at,
  i.updated_at,
  i.space_id,
  i.category_id,
  i.created_by,
  s.name as space_name,
  s.type as space_type,
  c.name as category_name,
  c.icon as category_icon,
  u.full_name as creator_name,
  i.search_vector
FROM items i
LEFT JOIN spaces s ON i.space_id = s.id
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN users u ON i.created_by = u.id
WHERE i.deleted_at IS NULL 
  AND s.deleted_at IS NULL;

CREATE UNIQUE INDEX idx_item_search_view_id ON item_search_view(id);
CREATE INDEX idx_item_search_view_search ON item_search_view USING GIN(search_vector);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_item_search_view()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY item_search_view;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers to refresh materialized view
CREATE TRIGGER refresh_search_view_items
  AFTER INSERT OR UPDATE OR DELETE ON items
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_item_search_view();

CREATE TRIGGER refresh_search_view_spaces
  AFTER UPDATE ON spaces
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_item_search_view();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON spaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User profile creation trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  is_first_user BOOLEAN;
  user_role user_role;
  user_status user_status;
  invite_code_val TEXT;
BEGIN
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM users;
  is_first_user := user_count = 0;
  
  -- Set role and status
  IF is_first_user THEN
    user_role := 'admin';
    user_status := 'approved';
  ELSE
    user_role := 'member';
    user_status := 'pending';
  END IF;
  
  -- Generate unique invite code
  invite_code_val := UPPER(SUBSTRING(MD5(NEW.id::text || EXTRACT(EPOCH FROM NOW())::text) FROM 1 FOR 8));
  
  -- Insert user profile
  INSERT INTO users (
    id, 
    email, 
    full_name, 
    role, 
    status, 
    invite_code,
    invited_by
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_role,
    user_status,
    invite_code_val,
    CASE WHEN NEW.raw_user_meta_data->>'invited_by' IS NOT NULL 
         THEN (NEW.raw_user_meta_data->>'invited_by')::UUID 
         ELSE NULL END
  );
  
  -- Create personal space for the user
  INSERT INTO spaces (name, description, type, owner_id, is_public)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My') || '''s Personal Vault',
    'Private space for personal items',
    'personal',
    NEW.id,
    false
  );
  
  -- Log the registration
  INSERT INTO activity_log (user_id, action, resource_type, resource_id, details)
  VALUES (
    NEW.id,
    'user_registered',
    'user',
    NEW.id,
    jsonb_build_object(
      'is_first_user', is_first_user,
      'role', user_role,
      'status', user_status
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Transaction support functions
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS void AS $$
BEGIN
  -- This is a placeholder for transaction management
  -- Supabase handles transactions automatically
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS void AS $$
BEGIN
  -- This is a placeholder for transaction management
  -- Supabase handles transactions automatically
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS void AS $$
BEGIN
  -- This is a placeholder for transaction management
  -- Supabase handles transactions automatically
END;
$$ LANGUAGE plpgsql;
