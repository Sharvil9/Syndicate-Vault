-- Drop existing RLS policies that are causing issues
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Allow user profile creation during signup" ON users;

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  is_first_user BOOLEAN;
  user_invite_code TEXT;
BEGIN
  -- Count existing users to determine if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.users;
  is_first_user := (user_count = 0);
  
  -- Generate unique invite code
  user_invite_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12));
  
  -- Insert user profile
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    status,
    invite_code,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN is_first_user THEN 'admin'::user_role ELSE 'member'::user_role END,
    CASE WHEN is_first_user THEN 'approved'::user_status ELSE 'pending'::user_status END,
    user_invite_code,
    NOW(),
    NOW()
  );
  
  -- Create personal space for the user
  INSERT INTO public.spaces (
    name,
    description,
    type,
    owner_id,
    is_public,
    created_at,
    updated_at
  ) VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)) || '''s Vault',
    'Personal knowledge repository',
    'personal'::space_type,
    NEW.id,
    false,
    NOW(),
    NOW()
  );
  
  -- Log the registration
  INSERT INTO public.activity_log (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    created_at
  ) VALUES (
    NEW.id,
    'user_registered',
    'user',
    NEW.id,
    jsonb_build_object(
      'is_first_user', is_first_user,
      'role', CASE WHEN is_first_user THEN 'admin' ELSE 'member' END
    ),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create proper RLS policies that work with the trigger
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.spaces TO authenticated;
GRANT ALL ON public.activity_log TO authenticated;
