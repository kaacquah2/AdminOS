#!/bin/bash

# Generate TypeScript types from Supabase schema
# Requires: Supabase CLI

set -e

echo "Generating TypeScript types from Supabase schema..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Generate types
supabase gen types typescript --local > lib/database.types.ts || {
    echo "Error: Failed to generate types from local database"
    echo "Trying remote database..."
    
    # Load environment variables
    if [ -f .env.local ]; then
        export $(cat .env.local | grep -v '^#' | xargs)
    fi
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo "Error: Supabase credentials not found in .env.local"
        exit 1
    fi
    
    supabase gen types typescript --project-id $(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co||') > lib/database.types.ts
}

echo "Types generated successfully: lib/database.types.ts"

