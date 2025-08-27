# 产品知识库管理平台

## 项目简介

这是一个基于 React + TypeScript + Supabase 的全栈产品知识库管理平台，支持产品信息管理、分类管理、用户权限控制、数据导入导出等功能。

## 功能特性

### 🔐 用户管理系统
- 用户注册、登录、权限管理
- 超级管理员、普通用户角色区分
- 用户状态管理（启用/禁用）

### 📦 产品管理
- 产品信息的增删改查
- 批量导入导出功能
- 产品分类管理
- 高级筛选和搜索

### 🏷️ 分类管理
- 分类的创建、编辑、删除
- 分类状态管理（显示/隐藏）
- 层级分类支持

### 📊 系统管理
- 操作日志审计
- 系统设置配置
- 数据统计分析

### 🎨 用户界面
- 响应式设计，支持移动端
- 现代化 UI 组件
- 企业级 LOGO 展示

## 技术架构

### 前端技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI 组件库**: Tailwind CSS + shadcn/ui
- **状态管理**: React Context API
- **路由**: React Router DOM

### 后端技术栈
- **BaaS 平台**: Supabase
- **数据库**: PostgreSQL
- **身份验证**: Supabase Auth
- **文件存储**: Supabase Storage
- **边缘函数**: Supabase Edge Functions

## 部署信息

- **当前部署地址**: https://0tyyl44rspf0.space.minimax.io
- **部署平台**: MiniMax Agent 平台
- **构建状态**: ✅ 已部署并运行正常

## 测试账户

### 超级管理员账户
- 邮箱: `pxqeozcu@minimax.com`
- 密码: `j4CtNfS5I6`

### 普通用户账户
- 邮箱: `rtrlzbqk@minimax.com`
- 密码: `xQxTwbTsMj`

## 项目结构

```
├── src/                    # 前端源代码
│   ├── components/         # React 组件
│   ├── pages/             # 页面组件
│   ├── lib/               # 工具库和服务
│   ├── hooks/             # 自定义 Hook
│   └── contexts/          # React Context
├── supabase/              # Supabase 配置
│   ├── functions/         # 边缘函数
│   ├── migrations/        # 数据库迁移文件
│   └── tables/           # 数据表结构
├── docs/                  # 技术文档
│   ├── 技术交付文档包.md
│   ├── 阿里云部署操作手册.md
│   ├── 系统性能和并发能力分析报告.md
│   └── MiniMax Agent协作开发指南.md
├── dist/                  # 构建输出
├── package.json           # 项目依赖
└── README.md             # 项目说明
```

## 快速开始

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **配置环境变量**
   ```bash
   # 在 .env 文件中配置 Supabase 连接信息
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **启动开发服务器**
   ```bash
   pnpm dev
   ```

4. **构建生产版本**
   ```bash
   pnpm build
   ```

## 技术文档

项目包含完整的技术文档：

- **技术交付文档包**: 详细的代码结构和开发指南
- **阿里云部署操作手册**: 云端部署的完整流程
- **系统性能分析报告**: 性能指标和优化建议
- **协作开发指南**: 团队协作的最佳实践

## 开发团队

- **开发**: MiniMax Agent
- **架构设计**: 基于现代全栈开发最佳实践
- **技术支持**: 完整的文档和部署指南

## 版本信息

- **版本**: v1.0.0
- **最后更新**: 2025-08-26
- **状态**: 生产就绪 ✅

---

这是一个功能完整、文档齐全的企业级产品知识库管理平台，适合直接部署使用或作为二次开发的基础。
