# Stage 1: Prune
FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com
RUN npm install -g pnpm@9
COPY . .
RUN pnpm dlx turbo prune --scope=@interview-ai/backend --docker

# Stage 2: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++ openssl
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-factor 2 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm install -g pnpm@9
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

ENV PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
ENV SHARP_BINARY_HOST=https://npmmirror.com/mirrors/sharp
ENV SHARP_LIBVIPS_BINARY_HOST=https://npmmirror.com/mirrors/sharp-libvips
ENV SASS_BINARY_SITE=https://npmmirror.com/mirrors/node-sass
ENV PYTHON_MIRROR=https://npmmirror.com/mirrors/python
ENV NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV SENTRYCLI_CDNURL=https://npmmirror.com/mirrors/sentry-cli/
ENV ESBUILD_BINARY_SITE=https://npmmirror.com/mirrors/esbuild

RUN pnpm config set registry https://registry.npmmirror.com && \
    pnpm install --no-frozen-lockfile --ignore-scripts

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
RUN cd packages/backend && pnpm prisma generate
RUN cd packages/backend && pnpm run build

ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN pnpm deploy --filter=@interview-ai/backend --prod /app/deploy

# 运行时需要 dist（应用）、prisma（迁移）与 skills（AI 技能定义，skill-loader 默认读 cwd/skills）
RUN cp -r packages/backend/dist /app/deploy/dist && \
    cp -r packages/backend/prisma /app/deploy/prisma && \
    cp -r packages/backend/skills /app/deploy/skills && \
    cp packages/backend/.env.example /app/deploy/.env.example

# Stage 3: Runtime
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache \
    chromium \
    openssl \
    curl \
    && rm -rf /var/cache/apk/* \
    && rm -rf /tmp/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/deploy /app

# CLI 版本必须与 pnpm-lock.yaml 中的 @prisma/client 7.9.1 一致；
# 保留 CLI 以便容器内执行 `prisma migrate deploy`。
RUN npm install -g prisma@7.9.1 && \
    printf "export default { schema: './prisma/schema.prisma', datasource: { url: process.env.DATABASE_URL } };\n" > /app/prisma.config.ts && \
    cd /app && prisma generate

RUN mkdir -p /app/backups /app/logs && \
    chown -R nestjs:nodejs /app/backups /app/logs

USER nestjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "dist/main"]
