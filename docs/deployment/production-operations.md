# Production Operations Quick Reference

## Service Management

### Docker Compose Commands (Production)
```bash
# View status of all services
docker-compose -f docker-compose.prod.yml ps

# Restart a specific service
docker-compose -f docker-compose.prod.yml restart <service-name>

# Stop and remove all services
docker-compose -f docker-compose.prod.yml down

# Rebuild and start a specific service
docker-compose -f docker-compose.prod.yml up -d --build <service-name>
```

### Process Management (PM2 - if applicable)
```bash
# List all processes
pm2 list

# Restart a process
pm2 restart <process-id|name>

# View real-time logs
pm2 logs <process-id|name>

# Monitor system resources
pm2 monit
```

---

## Log Management

### Viewing Docker Logs
```bash
# Real-time logs for all services
docker-compose -f docker-compose.prod.yml logs -f

# Logs for a specific service (last 100 lines)
docker-compose -f docker-compose.prod.yml logs -f --tail 100 <service-name>

# View logs for a specific container
docker logs -f <container-id>
```

### Nginx Logs
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

---

## Database Operations

### PostgreSQL
```bash
# Enter PostgreSQL shell
docker-compose -f docker-compose.prod.yml exec db psql -U <user> -d <database>

# List all tables
\dt

# Run a manual backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U <user> <database> > backup_$(date +%F).sql
```

### Redis
```bash
# Enter Redis CLI
docker-compose -f docker-compose.prod.yml exec redis redis-cli

# Check memory usage
info memory

# Clear all keys (use with caution!)
FLUSHALL
```

---

## Maintenance Tasks

### 1. Database Migrations
Run after updating the application code:
```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### 2. SSL Certificate Renewal
Certbot usually handles this automatically via a cron job, but you can trigger it manually:
```bash
sudo certbot renew --dry-run
```

### 3. Clearing Cache
If using Redis for caching:
```bash
docker-compose -f docker-compose.prod.yml exec redis redis-cli FLUSHDB
```

---

## Emergency Contacts & Escalation

- **System Administrator**: admin@example.com
- **DevOps Team**: devops@example.com
- **Cloud Provider Support**: [Link to support portal]
- **Slack Alert Channel**: #prod-alerts
