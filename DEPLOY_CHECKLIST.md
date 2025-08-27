# 🚀 Vercel 部署检查清单

## 📋 部署前检查

### ✅ 环境准备
- [ ] Node.js 18+ 已安装
- [ ] pnpm 已安装 (`npm i -g pnpm`)
- [ ] Vercel CLI 已安装 (`npm i -g vercel`)
- [ ] Git 仓库已推送到 GitHub

### ✅ 项目配置
- [x] `.env.example` 环境变量模板已创建
- [x] `.env` 生产环境变量已配置
- [x] `vercel.json` 部署配置已创建
- [x] `.vercelignore` 忽略文件已配置
- [x] `package.json` 构建脚本已优化

### ✅ 代码质量
- [x] TypeScript 类型检查通过 (`pnpm type-check`)
- [x] ESLint 代码规范检查通过 (`pnpm lint`)
- [x] 单元测试已添加 (`pnpm test:run`)
- [x] 生产构建成功 (`pnpm build:prod`)

### ✅ 性能优化
- [x] 路由懒加载已实现
- [x] 代码分割已配置
- [x] 静态资源优化已配置
- [x] 缓存策略已设置

## 🚀 快速部署

### 方法一：一键部署脚本
```bash
chmod +x deploy.sh
./deploy.sh
```

### 方法二：手动部署步骤

1. **登录 Vercel**
   ```bash
   vercel login
   ```

2. **初始化项目**
   ```bash
   vercel
   ```

3. **设置环境变量**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add VITE_APP_TITLE
   vercel env add NODE_ENV production
   vercel env add BUILD_MODE prod
   ```

4. **部署到生产环境**
   ```bash
   vercel --prod
   ```

## 📊 部署后验证

### ✅ 功能测试
- [ ] 网站可正常访问
- [ ] 登录功能正常
- [ ] 产品列表加载正常
- [ ] 产品详情页正常
- [ ] 管理员功能正常
- [ ] 响应式设计正常

### ✅ 性能测试
- [ ] 首屏加载时间 < 3秒
- [ ] Lighthouse 性能评分 > 90
- [ ] 静态资源缓存正常
- [ ] 路由切换流畅

### ✅ 安全检查
- [ ] HTTPS 证书正常
- [ ] 安全头设置正确
- [ ] 环境变量未泄露
- [ ] API 请求正常

## 🔧 测试账户

### 超级管理员
- 邮箱: `pxqeozcu@minimax.com`
- 密码: `j4CtNfS5I6`
- 权限: 所有功能

### 普通用户
- 邮箱: `rtrlzbqk@minimax.com`
- 密码: `xQxTwbTsMj`
- 权限: 基础查看功能

## 🚨 常见问题解决

### 构建失败
```bash
# 清理缓存重新构建
pnpm clean
pnpm install
pnpm build:prod
```

### 环境变量问题
```bash
# 检查环境变量
vercel env ls

# 重新设置环境变量
vercel env rm VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_URL
```

### 域名配置
```bash
# 添加自定义域名
vercel domains add your-domain.com
```

## 📈 部署后优化

### 监控设置
- [ ] 添加 Vercel Analytics
- [ ] 配置错误监控 (Sentry)
- [ ] 设置性能监控

### SEO 优化
- [ ] 添加 robots.txt
- [ ] 配置 sitemap.xml
- [ ] 优化 meta 标签

### CDN 优化
- [ ] 配置自定义域名
- [ ] 启用 CDN 缓存
- [ ] 优化图片资源

---

## 🎉 部署完成！

您的产品知识库管理平台已成功部署到 Vercel！

访问您的网站并享受高性能的用户体验。

如有问题，请查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 获取详细指南。