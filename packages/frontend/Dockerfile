# Stage 1: Prune
FROM node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV SHARP_BINARY_HOST=https://npmmirror.com/mirrors/sharp
ENV SHARP_LIBVIPS_BINARY_HOST=https://npmmirror.com/mirrors/sharp-libvips
ENV SASS_BINARY_SITE=https://npmmirror.com/mirrors/node-sass
ENV PYTHON_MIRROR=https://npmmirror.com/mirrors/python
ENV NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
ENV ESBUILD_BINARY_SITE=https://npmmirror.com/mirrors/esbuild

RUN npm config set registry https://registry.npmmirror.com
RUN npm install -g pnpm@9
COPY . .
RUN pnpm dlx turbo prune --scope=@interview-ai/frontend --docker

# Stage 2: Build
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com
RUN npm install -g pnpm@9
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

ENV SHARP_BINARY_HOST=https://npmmirror.com/mirrors/sharp
ENV SHARP_LIBVIPS_BINARY_HOST=https://npmmirror.com/mirrors/sharp-libvips
ENV SASS_BINARY_SITE=https://npmmirror.com/mirrors/node-sass
ENV PYTHON_MIRROR=https://npmmirror.com/mirrors/python
ENV NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node

RUN pnpm config set registry https://registry.npmmirror.com && \
    pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 必须与后端 APP_EDITION 一致：oss 时不注册 EE 路由，否则订阅页会调用不存在的 /payments/*
ARG VITE_APP_EDITION=oss
ENV VITE_APP_EDITION=${VITE_APP_EDITION}

RUN cd packages/frontend && pnpm run build

# Stage 3: Export static files
# This stage creates a minimal image that only contains the built static files
# The static files will be served by Caddy, not by this container
FROM alpine:latest
WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/packages/frontend/dist ./dist

# 真实检查静态产物是否存在，避免恒 exit 0 造成假阳性
RUN printf '#!/bin/sh\ntest -f /app/dist/index.html\n' > /health.sh && \
    chmod +x /health.sh

# This container doesn't serve files - Caddy will mount and serve them
# We keep this container running just to hold the built files
CMD ["tail", "-f", "/dev/null"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD /health.sh
