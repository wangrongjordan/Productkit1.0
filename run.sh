#!/bin/bash

# 产品知识库平台 - MCP 项目启动脚本
# Product Knowledge Base Platform - MCP Project Launcher

echo "🚀 产品知识库平台 MCP 项目"
echo "📋 项目功能："
echo "  - React + TypeScript 前端应用"
echo "  - Supabase 后端服务"
echo "  - 完整的用户管理和权限系统"
echo "  - 产品分类管理"
echo "  - 数据导入导出功能"
echo "  - 操作日志审计"
echo ""

# 提供可用的操作选项
echo "🛠️ 可用操作："
echo "  1. 查看项目结构 (show-structure)"
echo "  2. 查看部署信息 (show-deployment)"
echo "  3. 查看技术文档 (show-docs)"
echo "  4. 构建项目 (build)"
echo "  5. 启动开发服务器 (dev)"
echo ""

# 根据参数执行不同操作
case "$1" in
    "show-structure")
        echo "📁 项目结构："
        find . -type f -name "*.tsx" -o -name "*.ts" -o -name "*.sql" | head -20
        ;;
    "show-deployment")
        echo "🌐 部署信息："
        echo "当前部署地址: https://0tyyl44rspf0.space.minimax.io"
        echo "技术栈: React + TypeScript + Supabase"
        ;;
    "show-docs")
        echo "📚 技术文档："
        ls -la docs/
        ;;
    "build")
        echo "🔨 构建项目..."
        if [ -f "package.json" ]; then
            pnpm install && pnpm build
        else
            echo "❌ 未找到 package.json"
        fi
        ;;
    "dev")
        echo "💻 启动开发服务器..."
        if [ -f "package.json" ]; then
            pnpm install && pnpm dev
        else
            echo "❌ 未找到 package.json"
        fi
        ;;
    *)
        echo "💡 使用方法: ./run.sh [show-structure|show-deployment|show-docs|build|dev]"
        ;;
esac
