#!/bin/bash

# Apply database migrations to Supabase
# Usage: ./scripts/apply-migrations.sh

set -e

echo "Applying database migrations..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Apply migrations in order
echo "1. Creating initial schema..."
supabase db reset --db-url "$POSTGRES_URL"

echo "2. Applying schema..."
psql "$POSTGRES_URL" -f scripts/001-initial-schema.sql

echo "3. Setting up RLS policies..."
psql "$POSTGRES_URL" -f scripts/002-rls-policies.sql

echo "4. Seeding initial data..."
psql "$POSTGRES_URL" -f scripts/003-seed-data.sql

echo "✅ Database migrations applied successfully!"
echo ""
echo "Next steps:"
echo "1. Create your first admin user by signing up"
echo "2. Update the admin user role in the database"
echo "3. Start creating invite codes for other users"
