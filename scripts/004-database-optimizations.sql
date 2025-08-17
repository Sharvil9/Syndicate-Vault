-- Add composite indexes for better query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_space_created_at ON items(space_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_category_created_at ON items(category_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_user_space ON items(created_by, space_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_type_space ON items(type, space_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_favorite_user ON items(is_favorite, created_by) WHERE is_favorite = true;

-- Add soft delete functionality
ALTER TABLE items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create indexes for soft delete queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_deleted_at ON items(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_spaces_deleted_at ON spaces(deleted_at) WHERE deleted_at IS NULL;

-- Add audit trail enhancements
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS request_id TEXT;

-- Create function for soft delete
CREATE OR REPLACE FUNCTION soft_delete_item(item_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE items 
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = item_uuid AND deleted_at IS NULL;
  
  -- Also soft delete associated attachments
  UPDATE attachments 
  SET deleted_at = NOW()
  WHERE item_id = item_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create function for restoring soft deleted items
CREATE OR REPLACE FUNCTION restore_item(item_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE items 
  SET deleted_at = NULL, updated_at = NOW()
  WHERE id = item_uuid;
  
  -- Also restore associated attachments
  UPDATE attachments 
  SET deleted_at = NULL
  WHERE item_id = item_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to exclude soft deleted items
DROP POLICY IF EXISTS "Users can view items in accessible spaces" ON items;
CREATE POLICY "Users can view items in accessible spaces" ON items
  FOR SELECT USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM spaces s 
      WHERE s.id = space_id AND s.deleted_at IS NULL AND (
        (s.type = 'personal' AND s.owner_id = auth.uid()) OR
        (s.type = 'common' AND s.is_public = true)
      )
    )
  );

-- Add materialized view for search performance
CREATE MATERIALIZED VIEW IF NOT EXISTS item_search_view AS
SELECT 
  i.id,
  i.title,
  i.content,
  i.excerpt,
  i.tags,
  i.type,
  i.created_at,
  i.updated_at,
  i.is_favorite,
  i.space_id,
  i.category_id,
  i.created_by,
  s.name as space_name,
  s.type as space_type,
  c.name as category_name,
  c.icon as category_icon,
  c.color as category_color,
  i.search_vector
FROM items i
LEFT JOIN spaces s ON i.space_id = s.id
LEFT JOIN categories c ON i.category_id = c.id
WHERE i.deleted_at IS NULL 
  AND s.deleted_at IS NULL 
  AND (c.deleted_at IS NULL OR c.id IS NULL);

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_item_search_view_vector ON item_search_view USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_item_search_view_space ON item_search_view(space_id, created_at DESC);

-- Create function to refresh search view
CREATE OR REPLACE FUNCTION refresh_item_search_view()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY item_search_view;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to refresh search view on item changes
CREATE OR REPLACE FUNCTION trigger_refresh_search_view()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh the materialized view asynchronously
  PERFORM pg_notify('refresh_search_view', '');
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS refresh_search_view_trigger ON items;
CREATE TRIGGER refresh_search_view_trigger
  AFTER INSERT OR UPDATE OR DELETE ON items
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_search_view();
