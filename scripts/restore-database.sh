#!/bin/bash

# Database Restore Script for Supabase
# This script restores a backup of the Supabase database
# Usage: ./restore-database.sh <backup_file>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Backup file not specified${NC}"
    echo "Usage: ./restore-database.sh <backup_file>"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will overwrite your current database!${NC}"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled${NC}"
    exit 0
fi

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Get database URL
if [ -z "$SUPABASE_DB_URL" ]; then
    echo -e "${RED}Error: SUPABASE_DB_URL not set${NC}"
    echo "Set it in .env.local or as an environment variable"
    exit 1
fi

echo -e "${GREEN}Restoring database from: ${BACKUP_FILE}${NC}"

# Check if file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -e "${GREEN}Decompressing backup...${NC}"
    gunzip -c "$BACKUP_FILE" | psql "$SUPABASE_DB_URL"
else
    psql "$SUPABASE_DB_URL" < "$BACKUP_FILE"
fi

echo -e "${GREEN}Database restored successfully!${NC}"

