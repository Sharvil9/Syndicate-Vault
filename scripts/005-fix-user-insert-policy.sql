-- Fix RLS policy for user creation during signup
-- Drop existing policies if they exist and recreate them properly

-- Allow users to insert their own profile during signup
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
CREATE POLICY "Users can create their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Also ensure users can read their own profile after creation
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile (but not role/status)
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    -- Prevent users from changing their own role or status
    (OLD.role = NEW.role) AND 
    (OLD.status = NEW.status)
  );

-- Admin policies remain the same
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update user status and roles" ON users;
CREATE POLICY "Admins can update user status and roles" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Alternative: If the above doesn't work, we can temporarily allow all inserts
-- and then restrict them later. Uncomment the lines below if needed:

-- DROP POLICY IF EXISTS "Allow signup inserts" ON users;
-- CREATE POLICY "Allow signup inserts" ON users
--   FOR INSERT WITH CHECK (true);
