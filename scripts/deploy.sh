#!/bin/bash
# Production Deployment Script
# Requirements: Docker, Docker Compose

set -e

echo "=========================================="
echo "Resume Optimizer - Production Deployment"
echo "=========================================="
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "ERROR: .env.production file not found!"
    echo "Please copy .env.production.example to .env.production and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "Step 1: Pre-deployment checks..."

# Check required environment variables
REQUIRED_VARS=(
    "POSTGRES_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "OPENAI_API_KEY"
    "DOMAIN"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "ERROR: Required environment variable ${var} is not set!"
        exit 1
    fi
done

echo "✓ Environment variables validated"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running!"
    exit 1
fi

echo "✓ Docker is running"

echo ""
echo "Step 2: Building Docker images..."
docker-compose -f deployment/docker-compose.prod.yml build

echo "✓ Docker images built"

echo ""
echo "Step 3: Starting database services..."
docker-compose -f deployment/docker-compose.prod.yml up -d postgres redis

echo "Waiting for database to be ready..."
sleep 10

echo "✓ Database services started"

echo ""
echo "Step 4: Running database migrations..."
docker-compose -f deployment/docker-compose.prod.yml run --rm backend npx prisma migrate deploy

echo "✓ Database migrations completed"

echo ""
echo "Step 5: Seeding database with initial data..."
docker-compose -f deployment/docker-compose.prod.yml run --rm backend npx prisma db seed

echo "✓ Database seeded"

echo ""
echo "Step 6: Starting application services..."
docker-compose -f deployment/docker-compose.prod.yml up -d backend frontend

echo "Waiting for services to be ready..."
sleep 15

echo "✓ Application services started"

echo ""
echo "Step 7: Starting Nginx load balancer..."
docker-compose -f deployment/docker-compose.prod.yml up -d nginx

echo "✓ Nginx started"

echo ""
echo "Step 8: Starting backup service..."
docker-compose -f deployment/docker-compose.prod.yml up -d postgres-backup

echo "✓ Backup service started"

echo ""
echo "Step 9: Health check..."

# Wait for services to be healthy
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo "✓ Health check passed"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for services to be healthy... (${RETRY_COUNT}/${MAX_RETRIES})"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "ERROR: Health check failed after ${MAX_RETRIES} attempts"
    echo "Check logs: docker-compose -f deployment/docker-compose.prod.yml logs"
    exit 1
fi

echo ""
echo "Step 10: Displaying service status..."
docker-compose -f deployment/docker-compose.prod.yml ps

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Services are running at:"
echo "  HTTP:  http://localhost"
echo "  HTTPS: https://${DOMAIN} (after SSL setup)"
echo ""
