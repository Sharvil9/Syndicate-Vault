-- Add approval fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Create index for approval queries
CREATE INDEX IF NOT EXISTS idx_users_approved_at ON users(approved_at);

-- Update existing users to be approved (for migration)
UPDATE users SET approved_at = created_at WHERE approved_at IS NULL AND role = 'admin';
