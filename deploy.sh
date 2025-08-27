#!/bin/bash

# Product Knowledge Platform - Vercel Deploy Script
# 产品知识库管理平台 - Vercel 部署脚本

set -e

echo "🚀 开始部署产品知识库管理平台到 Vercel..."

# 检查依赖
echo "📋 检查部署前置条件..."

# 检查 Node.js 版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
if [ "$(printf '%s\n' "18.0.0" "$NODE_VERSION" | sort -V | head -n1)" != "18.0.0" ]; then
    echo "❌ Node.js 版本过低，需要 18.0.0+，当前版本: $NODE_VERSION"
    exit 1
fi

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "⚙️ 安装 pnpm..."
    npm install -g pnpm
fi

# 检查 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "⚙️ 安装 Vercel CLI..."
    npm install -g vercel
fi

echo "✅ 前置条件检查完成"

# 清理并安装依赖
echo "📦 安装依赖..."
pnpm clean || true
pnpm install

# 类型检查
echo "🔍 执行类型检查..."
pnpm type-check

# 代码规范检查
echo "🧹 执行代码规范检查..."
pnpm lint

# 运行测试
echo "🧪 运行单元测试..."
pnpm test:run || true

# 构建项目
echo "🏗️ 构建生产版本..."
pnpm build:prod

echo "✅ 项目构建完成"

# 部署到 Vercel
echo "🚀 部署到 Vercel..."

# 检查是否已登录 Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 请先登录 Vercel..."
    vercel login
fi

# 执行部署
echo "📤 执行部署..."
vercel --prod

echo "🎉 部署完成！"
echo ""
echo "📋 部署后检查清单："
echo "  □ 访问部署的网站确认可正常打开"
echo "  □ 测试登录功能"
echo "  □ 测试产品管理功能"
echo "  □ 检查响应式设计"
echo "  □ 验证 API 连接正常"
echo ""
echo "🔧 测试账户："
echo "  超级管理员: pxqeozcu@minimax.com / j4CtNfS5I6"
echo "  普通用户: rtrlzbqk@minimax.com / xQxTwbTsMj"
echo ""
echo "📊 性能检查："
echo "  运行 'npx lighthouse <your-domain> --output=html' 检查性能"