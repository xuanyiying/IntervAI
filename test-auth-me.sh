#!/bin/bash

# 测试 /auth/me 接口是否返回 role 字段

echo "请输入你的 JWT token (从浏览器 localStorage 中获取 auth_token):"
read TOKEN

echo ""
echo "正在测试 /auth/me 接口..."
echo ""

curl -X GET "http://localhost:3000/api/v1/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq .

echo ""
echo "如果上面的响应中没有 'role' 字段，说明后端服务需要重启"
echo ""
echo "重启后端服务的命令:"
echo "  cd packages/backend"
echo "  pnpm run dev"
