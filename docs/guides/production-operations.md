# Production Operations Quick Reference

## Service Management

### Docker Compose Commands (Production)
```bash
# View status
docker-compose -f docker-compose.prod.yml ps

# Restart a specific service
docker-compose -f docker-compose.prod.yml restart <service-name>

# Rebuild and start a specific service
docker-compose -f docker-compose.prod.yml up -d --build <service-name>
```

## Log Management

### Viewing Docker Logs
```bash
# Real-time logs for all services
docker-compose -f docker-compose.prod.yml logs -f

# Logs for a specific service (last 100 lines)
docker-compose -f docker-compose.prod.yml logs -f --tail 100 <service-name>
```

### Nginx Logs
- Access logs: `/var/log/nginx/access.log`
- Error logs: `/var/log/nginx/error.log`

## Database Operations

### PostgreSQL
```bash
# Enter PostgreSQL shell
docker-compose -f docker-compose.prod.yml exec db psql -U <user> -d <database>

# Run a manual backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U <user> <database> > backup_$(date +%F).sql
```

### Redis
```bash
# Enter Redis CLI
docker-compose -f docker-compose.prod.yml exec redis redis-cli

# Clear all keys (use with caution!)
FLUSHALL
```

## Maintenance Tasks

1. **Database Migrations**: `docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy`
2. **SSL Certificate Renewal**: `sudo certbot renew`
3. **Clearing Cache**: `docker-compose -f docker-compose.prod.yml exec redis redis-cli FLUSHDB`
