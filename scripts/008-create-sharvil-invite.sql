-- Create specific invite code for sharvilkhade99@gmail.com
INSERT INTO invite_codes (code, created_by, expires_at, max_uses, current_uses) 
VALUES (
  'SHARVIL2024',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  NOW() + INTERVAL '30 days',
  1,
  0
) ON CONFLICT (code) DO UPDATE SET
  expires_at = NOW() + INTERVAL '30 days',
  current_uses = 0;

-- Also create a general invite code that works
INSERT INTO invite_codes (code, expires_at, max_uses, current_uses) 
VALUES (
  'VAULT2024',
  NOW() + INTERVAL '30 days',
  10,
  0
) ON CONFLICT (code) DO UPDATE SET
  expires_at = NOW() + INTERVAL '30 days';
