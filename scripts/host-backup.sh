#!/bin/bash

# ==============================================================================
# IntervAI PostgreSQL Database Lightweight Backup Script
# 
# Purpose: Decouple backup from the docker-compose stack to save memory.
#          Creates a pg_dump structure from the running postgres container.
#
# Usage:
#   Run this script via a daily cron job on the host machine.
#   Example cron (runs daily at 2:00 AM):
#   0 2 * * * /path/to/IntervAI/scripts/host-backup.sh >> /var/log/intervai-backup.log 2>&1
# ==============================================================================

set -e

# Configuration
CONTAINER_NAME="postgres"
BACKUP_DIR="$(pwd)/../backups/postgres" 
# Ensure it evaluates to an absolute path if possible or adjust to absolute path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/../backups/postgres"

DB_USER="${POSTGRES_USER:-intervai_user}"
DB_NAME="${POSTGRES_DB:-intervai_db}"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "======================================================================"
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting IntervAI database backup..."
echo "======================================================================"

# 1. Create backups directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# 2. Check if the postgres container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Error: Container '${CONTAINER_NAME}' is not running."
  exit 1
fi

# 3. Create the backup using pg_dump inside the container and compress it on the host
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Generating backup..."

if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup successfully created: ${BACKUP_FILE}"
    echo "Size: $(ls -lh "$BACKUP_FILE" | awk '{print $5}')"
else
    echo "Error: Backup failed."
    rm -f "$BACKUP_FILE"
    exit 1
fi

# 4. Clean up old backups based on RETENTION_DAYS
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Cleaning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "======================================================================"
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup process completed."
echo "======================================================================"

# Optional: Add AWS CLI / MinIO Client (mc) logic here if you want to push to remote immediately
# Example: 
# aws s3 cp "$BACKUP_FILE" s3://my-backup-bucket/intervai/ --endpoint-url https://minio.example.com
