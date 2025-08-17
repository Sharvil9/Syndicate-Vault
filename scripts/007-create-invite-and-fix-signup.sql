-- Create specific invite code for sharvilkhade99@gmail.com and fix signup issues
-- First, create the invite code for the specified user
INSERT INTO invite_codes (code, created_by, expires_at, max_uses, current_uses) 
VALUES (
  'SHARVIL2024', 
  '00000000-0000-0000-0000-000000000000', -- System generated
  NOW() + INTERVAL '30 days',
  1,
  0
);

-- Drop existing trigger and function to recreate properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  user_role user_role;
  user_status user_status;
  personal_space_id UUID;
BEGIN
  -- Count existing users to determine if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  -- Set role and status based on user count
  IF user_count = 0 THEN
    user_role := 'admin';
    user_status := 'approved';
  ELSE
    user_role := 'member';
    user_status := 'pending';
  END IF;

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
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    user_role,
    user_status,
    substring(md5(random()::text) from 1 for 8),
    NOW(),
    NOW()
  );

  -- Create personal space
  INSERT INTO public.spaces (
    name,
    description,
    type,
    owner_id,
    is_public,
    created_at,
    updated_at
  ) VALUES (
    split_part(NEW.email, '@', 1) || '''s Vault',
    'Personal knowledge repository',
    'personal',
    NEW.id,
    false,
    NOW(),
    NOW()
  );

  -- Log the activity
  INSERT INTO public.activity_log (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    created_at
  ) VALUES (
    NEW.id,
    'user_signup',
    'user',
    NEW.id,
    jsonb_build_object('role', user_role, 'status', user_status),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically handle new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.spaces TO authenticated;
GRANT ALL ON public.activity_log TO authenticated;
