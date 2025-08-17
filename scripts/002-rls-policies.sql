-- Creating comprehensive RLS policies with proper security controls
-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own basic info" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent users from changing their own role or status
    role = (SELECT role FROM users WHERE id = auth.uid()) AND
    status = (SELECT status FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update user status and roles" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Spaces policies
CREATE POLICY "Users can view accessible spaces" ON spaces
  FOR SELECT USING (
    deleted_at IS NULL AND (
      (type = 'personal' AND owner_id = auth.uid()) OR
      (type = 'common' AND is_public = true) OR
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "Users can create personal spaces" ON spaces
  FOR INSERT WITH CHECK (
    type = 'personal' AND owner_id = auth.uid()
  );

CREATE POLICY "Users can update their own spaces" ON spaces
  FOR UPDATE USING (
    deleted_at IS NULL AND owner_id = auth.uid()
  );

CREATE POLICY "Admins can manage all spaces" ON spaces
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Categories policies
CREATE POLICY "Users can view categories in accessible spaces" ON categories
  FOR SELECT USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM spaces s 
      WHERE s.id = space_id AND s.deleted_at IS NULL AND (
        (s.type = 'personal' AND s.owner_id = auth.uid()) OR
        (s.type = 'common' AND s.is_public = true) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY "Users can manage categories in their spaces" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM spaces s 
      WHERE s.id = space_id AND s.deleted_at IS NULL AND (
        s.owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

-- Items policies
CREATE POLICY "Users can view items in accessible spaces" ON items
  FOR SELECT USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM spaces s 
      WHERE s.id = space_id AND s.deleted_at IS NULL AND (
        (s.type = 'personal' AND s.owner_id = auth.uid()) OR
        (s.type = 'common' AND s.is_public = true) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY "Users can create items in accessible spaces" ON items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM spaces s 
      WHERE s.id = space_id AND s.deleted_at IS NULL AND (
        (s.type = 'personal' AND s.owner_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      )
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their own items" ON items
  FOR UPDATE USING (
    deleted_at IS NULL AND created_by = auth.uid()
  );

CREATE POLICY "Admins can manage all items" ON items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Attachments policies
CREATE POLICY "Users can view attachments for accessible items" ON attachments
  FOR SELECT USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM items i
      JOIN spaces s ON i.space_id = s.id
      WHERE i.id = item_id AND i.deleted_at IS NULL AND s.deleted_at IS NULL AND (
        (s.type = 'personal' AND s.owner_id = auth.uid()) OR
        (s.type = 'common' AND s.is_public = true) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY "Users can manage attachments for their items" ON attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM items i 
      WHERE i.id = item_id AND i.deleted_at IS NULL AND (
        i.created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

-- Revisions policies
CREATE POLICY "Users can view revisions for accessible items" ON revisions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN spaces s ON i.space_id = s.id
      WHERE i.id = item_id AND i.deleted_at IS NULL AND s.deleted_at IS NULL AND (
        (s.type = 'personal' AND s.owner_id = auth.uid()) OR
        (s.type = 'common' AND s.is_public = true) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY "System can create revisions" ON revisions
  FOR INSERT WITH CHECK (true);

-- Edit requests policies
CREATE POLICY "Users can view edit requests for accessible items" ON edit_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM items i
      JOIN spaces s ON i.space_id = s.id
      WHERE (i.id = item_id OR item_id IS NULL) AND s.type = 'common' AND s.is_public = true AND (
        requested_by = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      )
    ) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create edit requests for common items" ON edit_requests
  FOR INSERT WITH CHECK (
    requested_by = auth.uid() AND (
      item_id IS NULL OR
      EXISTS (
        SELECT 1 FROM items i
        JOIN spaces s ON i.space_id = s.id
        WHERE i.id = item_id AND s.type = 'common' AND s.is_public = true
      )
    )
  );

CREATE POLICY "Admins can manage edit requests" ON edit_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Activity log policies
CREATE POLICY "Users can view their own activity" ON activity_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity" ON activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can log activity" ON activity_log
  FOR INSERT WITH CHECK (true);

-- Invite codes policies
CREATE POLICY "Users can view their own invite codes" ON invite_codes
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage invite codes" ON invite_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can use invite codes for signup" ON invite_codes
  FOR SELECT USING (true);

CREATE POLICY "System can update invite code usage" ON invite_codes
  FOR UPDATE USING (true);
