# Syndicate Vault

A private, invite-only knowledge repository for your syndicate. Save, organize, and share insights with your trusted network.

## Features

- **Private & Secure**: Invite-only access with role-based permissions
- **Organized Knowledge**: Personal and common spaces with categories and tags
- **Save from Web**: Bookmarklet and browser extension for content capture
- **Full-Text Search**: Powerful search across all your saved content
- **Revision History**: Track changes and revert when needed
- **Admin Dashboard**: Manage users, permissions, and system activity

## Quick Start

### 1. Database Setup

\`\`\`bash
# Apply database migrations
./scripts/apply-migrations.sh
\`\`\`

### 2. Environment Variables

Copy `.env.example` to `.env.local` and configure:

\`\`\`env
# Supabase Configuration (automatically provided by v0)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Development redirect URL for email confirmation
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/vault
\`\`\`

### 3. First Admin User

1. Sign up using an invite code (VAULT2024 or BETA-ACCESS)
2. Update your role to admin in the database:

\`\`\`sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
\`\`\`

### 4. Development

\`\`\`bash
npm run dev
\`\`\`

## Save-from-Web Setup

### Bookmarklet

1. Go to `/vault/bookmarklet` in your vault
2. Copy the bookmarklet code
3. Create a new bookmark with the code as the URL
4. Click the bookmark on any page to save content

### Browser Extension (Development)

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `chrome-extension` folder
4. The extension will appear in your toolbar

## API Endpoints

### Items

- `POST /api/items` - Create new item
- `GET /api/items` - List items with filters
- `POST /api/items/snapshot` - Save web page with HTML snapshot

### Authentication

- `POST /api/auth/signup` - Sign up with invite code
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out

### Admin

- `POST /api/admin/invite` - Generate invite codes (admin only)
- `GET /api/admin/users` - List all users (admin only)
- `POST /api/admin/edit-requests/:id/approve` - Approve edit requests

## Database Schema

### Core Tables

- `users` - User profiles and roles
- `spaces` - Common and personal spaces
- `categories` - Organization categories
- `items` - Saved content (bookmarks, notes, files)
- `attachments` - File uploads
- `revisions` - Version history
- `edit_requests` - Pending changes for common spaces
- `activity_log` - System activity tracking
- `invite_codes` - Access control

### Security

- Row Level Security (RLS) enabled on all tables
- Personal spaces: owner access only
- Common spaces: read access for all, write requests for non-admins
- Admin-only access to user management and system settings

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

\`\`\`bash
npm run build
npm start
\`\`\`

## Browser Extension Development

The extension files are in the `chrome-extension/` directory:

- `manifest.json` - Extension configuration
- `popup.html/js` - Extension popup interface
- `content.js` - Page content access
- `background.js` - Background service worker

To package for Chrome Web Store:

\`\`\`bash
cd chrome-extension
zip -r syndicate-vault-extension.zip .
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Security Considerations

- All HTML content is sanitized before storage
- File uploads are validated for type and size
- RLS policies prevent unauthorized data access
- Invite codes control user registration
- Admin actions are logged for audit trails

## Support

For issues and feature requests, please use the GitHub issue tracker or contact the development team.
