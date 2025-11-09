#!/bin/bash

# Database Backup Script for Supabase
# This script creates a backup of the Supabase database
# Requires: Supabase CLI and pg_dump

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting database backup...${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI is not installed${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Warning: .env.local not found. Using environment variables.${NC}"
fi

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Get database URL from Supabase
if [ -z "$SUPABASE_DB_URL" ]; then
    echo -e "${YELLOW}SUPABASE_DB_URL not set. Attempting to get from Supabase project...${NC}"
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        echo -e "${RED}Error: NEXT_PUBLIC_SUPABASE_URL not set${NC}"
        exit 1
    fi
    
    # Note: You'll need to get the database connection string from Supabase Dashboard
    # Settings > Database > Connection string
    echo -e "${YELLOW}Please set SUPABASE_DB_URL in .env.local${NC}"
    echo "Get it from: Supabase Dashboard > Settings > Database > Connection string"
    exit 1
fi

# Create backup using pg_dump
echo -e "${GREEN}Creating backup: ${BACKUP_FILE}${NC}"

if command -v pg_dump &> /dev/null; then
    pg_dump "$SUPABASE_DB_URL" > "$BACKUP_FILE"
    echo -e "${GREEN}Backup created successfully!${NC}"
    echo -e "File: ${BACKUP_FILE}"
    echo -e "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo -e "${YELLOW}pg_dump not found. Using Supabase CLI...${NC}"
    
    # Alternative: Use Supabase CLI
    supabase db dump -f "$BACKUP_FILE" || {
        echo -e "${RED}Error: Failed to create backup${NC}"
        exit 1
    }
fi

# Compress backup (optional)
if command -v gzip &> /dev/null; then
    echo -e "${GREEN}Compressing backup...${NC}"
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    echo -e "${GREEN}Backup compressed: ${BACKUP_FILE}${NC}"
fi

# Clean up old backups (keep last 7 days)
echo -e "${GREEN}Cleaning up old backups (keeping last 7 days)...${NC}"
find "${BACKUP_DIR}" -name "backup_*.sql*" -mtime +7 -delete

echo -e "${GREEN}Backup completed successfully!${NC}"

