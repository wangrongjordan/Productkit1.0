# Vercel 部署指南

## 📋 部署前准备

### 1. 环境要求
- Node.js 18+ 
- pnpm (推荐) 或 npm/yarn
- Git 仓库
- Vercel 账户

### 2. 项目配置检查
确保以下文件已正确配置：
- ✅ `vercel.json` - Vercel 部署配置
- ✅ `.env.example` - 环境变量模板
- ✅ `package.json` - 构建脚本
- ✅ `.vercelignore` - 忽略文件配置

## 🚀 部署步骤

### 方法一：通过 Vercel CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **初始化项目**
   ```bash
   cd product-knowledge-platform-mcp
   vercel
   ```

4. **设置环境变量**
   ```bash
   # 设置 Supabase 配置
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   
   # 设置应用配置
   vercel env add VITE_APP_TITLE
   vercel env add VITE_APP_DESCRIPTION
   vercel env add VITE_APP_VERSION
   
   # 设置构建配置
   vercel env add NODE_ENV production
   vercel env add BUILD_MODE prod
   ```

5. **部署到生产环境**
   ```bash
   vercel --prod
   ```

### 方法二：通过 GitHub 集成自动部署

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "feat: optimize for Vercel deployment"
   git push origin main
   ```

2. **在 Vercel 中导入项目**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 选择 GitHub 仓库
   - 导入项目

3. **配置构建设置**
   - **Framework Preset**: Vite
   - **Build Command**: `pnpm build:prod`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

4. **设置环境变量**
   在 Vercel 项目设置中添加以下环境变量：
   
   ```
   VITE_SUPABASE_URL=https://syaypwklvsfupwlcgxqz.supabase.co
   VITE_SUPABASE_ANON_KEY=你的_supabase_anon_key
   VITE_APP_TITLE=产品知识库管理平台
   VITE_APP_DESCRIPTION=企业级产品知识管理系统
   VITE_APP_VERSION=1.0.0
   NODE_ENV=production
   BUILD_MODE=prod
   VITE_ENABLE_ANALYTICS=false
   VITE_ENABLE_DEBUG=false
   ```

## 🔧 配置说明

### vercel.json 配置详解
```json
{
  "version": 2,
  "buildCommand": "pnpm build:prod",
  "outputDirectory": "dist",
  "installCommand": "pnpm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 环境变量说明
| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | https://xxx.supabase.co |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | eyJhbGciOiJIUzI1NiIs... |
| `VITE_APP_TITLE` | 应用标题 | 产品知识库管理平台 |
| `NODE_ENV` | 环境模式 | production |
| `BUILD_MODE` | 构建模式 | prod |

## 📊 性能优化

### 1. 构建优化
- ✅ 代码分割 (Code Splitting)
- ✅ 懒加载 (Lazy Loading)
- ✅ Tree Shaking
- ✅ 资源压缩
- ✅ 缓存优化

### 2. 部署优化
- ✅ CDN 加速
- ✅ 静态资源缓存
- ✅ Gzip 压缩
- ✅ 安全头设置

## 🔍 部署验证

### 检查清单
- [ ] 网站可正常访问
- [ ] 登录功能正常
- [ ] 产品管理功能正常
- [ ] 响应式设计正常
- [ ] 路由跳转正常
- [ ] API 请求正常

### 性能检查
```bash
# 使用 Lighthouse 检查性能
npx lighthouse https://your-vercel-domain.vercel.app --output=html --output-path=./lighthouse-report.html
```

### 测试账户
部署完成后，使用以下测试账户验证功能：

**超级管理员**
- 邮箱: `pxqeozcu@minimax.com`
- 密码: `j4CtNfS5I6`

**普通用户**
- 邮箱: `rtrlzbqk@minimax.com`
- 密码: `xQxTwbTsMj`

## 🚨 常见问题

### 1. 构建失败
**问题**: `pnpm: command not found`
**解决**: 在 Vercel 设置中使用 `npm install` 作为安装命令

### 2. 环境变量问题
**问题**: Supabase 连接失败
**解决**: 检查环境变量是否正确设置，确保 `VITE_` 前缀

### 3. 路由问题
**问题**: 直接访问路由返回 404
**解决**: 确保 `vercel.json` 中的 rewrites 配置正确

### 4. 静态资源加载失败
**问题**: CSS/JS 文件 404
**解决**: 检查 `vite.config.ts` 中的 base 配置

## 📞 技术支持

如果遇到部署问题，可以：
1. 查看 Vercel 构建日志
2. 检查浏览器控制台错误
3. 验证 Supabase 配置
4. 确认环境变量设置

## 🎯 后续优化建议

1. **监控集成**: 添加 Vercel Analytics
2. **错误追踪**: 集成 Sentry 或类似服务
3. **性能监控**: 添加 Web Vitals 追踪
4. **A/B 测试**: 使用 Vercel Edge Functions
5. **CDN 优化**: 配置自定义域名和 CDN

---

✅ **部署完成后，您的产品知识库管理平台将在 Vercel 上高效运行！**