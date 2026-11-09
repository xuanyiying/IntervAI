# IntervAI 常用命令封装
# 部署以根目录 deploy.sh 为准；开发基础设施用 deployment/docker-compose.yml。
# 所有 Docker 命令统一使用 Compose v2（docker compose）。

COMPOSE_DEV  := docker compose -f deployment/docker-compose.yml
COMPOSE_PROD := docker compose --env-file .env.production -f deployment/docker-compose.prod.yml
POSTGRES_USER ?= postgres
POSTGRES_DB   ?= interview_ai

.PHONY: help dev prod deploy backup restore list-backups migrate infra-up infra-down infra-ps logs logs-backend db-shell lint test build clean

help:
	@echo "IntervAI 常用命令"
	@echo ""
	@echo "  make dev              启动开发基础设施 + 本地前后端"
	@echo "  make prod             生产部署（./deploy.sh --env prod）"
	@echo "  make deploy           生产部署并先备份数据库"
	@echo "  make backup           备份数据库"
	@echo "  make restore FILE=x   从备份恢复数据库"
	@echo "  make list-backups     列出备份"
	@echo "  make migrate          本地执行 Prisma 迁移"
	@echo "  make infra-up         仅启动 PostgreSQL/Redis/MinIO/Jaeger"
	@echo "  make infra-down       停止开发基础设施"
	@echo "  make infra-ps         查看基础设施状态"
	@echo "  make logs             生产环境实时日志"
	@echo "  make logs-backend     生产后端日志"
	@echo "  make db-shell         进入生产 PostgreSQL"
	@echo "  make lint | test | build | clean   对应 pnpm 脚本"
	@echo ""

dev: infra-up
	pnpm dev

prod:
	./deploy.sh --env prod

deploy:
	./deploy.sh --env prod --backup

backup:
	bash deployment/scripts/manage-db.sh backup

restore:
	@test -n "$(FILE)" || (echo "用法: make restore FILE=<备份文件>"; exit 1)
	bash deployment/scripts/manage-db.sh restore $(FILE)

list-backups:
	bash deployment/scripts/manage-db.sh list

migrate:
	pnpm --filter @interview-ai/backend exec prisma migrate deploy

infra-up:
	$(COMPOSE_DEV) up -d

infra-down:
	$(COMPOSE_DEV) down

infra-ps:
	$(COMPOSE_DEV) ps

logs:
	$(COMPOSE_PROD) logs -f

logs-backend:
	$(COMPOSE_PROD) logs -f backend

db-shell:
	$(COMPOSE_PROD) exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

lint:
	pnpm lint

test:
	pnpm test

build:
	pnpm build:backend
	pnpm build:frontend

clean:
	pnpm clean
