-- Insert admin user (this will be created after first signup)
-- The actual user creation happens through Supabase Auth

-- Create common space
INSERT INTO spaces (id, name, description, type, is_public) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Common Vault', 'Shared knowledge repository for all members', 'common', true);

-- Create default categories for common space
INSERT INTO categories (name, description, icon, color, space_id) VALUES
  ('Resources', 'Useful links and references', '📚', '#3b82f6', '00000000-0000-0000-0000-000000000001'),
  ('Tools', 'Software and utilities', '🛠️', '#10b981', '00000000-0000-0000-0000-000000000001'),
  ('Research', 'Articles and studies', '🔬', '#8b5cf6', '00000000-0000-0000-0000-000000000001'),
  ('Documentation', 'Guides and documentation', '📖', '#f59e0b', '00000000-0000-0000-0000-000000000001');

-- Create some sample invite codes
INSERT INTO invite_codes (code, expires_at, max_uses) VALUES
  ('VAULT2024', NOW() + INTERVAL '30 days', 10),
  ('BETA-ACCESS', NOW() + INTERVAL '7 days', 5);
