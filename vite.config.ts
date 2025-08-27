import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import sourceIdentifierPlugin from 'vite-plugin-source-identifier'

const isProd = process.env.BUILD_MODE === 'prod'

export default defineConfig({
  plugins: [
    react(), 
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // 启用代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 React 相关库打包为单独的 chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 将 UI 组件库打包为单独的 chunk
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast'
          ],
          // 将 Supabase 打包为单独的 chunk
          'supabase-vendor': ['@supabase/supabase-js'],
          // 将工具库打包为单独的 chunk
          'utils-vendor': ['clsx', 'tailwind-merge', 'date-fns', 'zod']
        }
      }
    },
    // 启用 Terser 压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: isProd,
        drop_debugger: isProd
      }
    },
    // 生成 source map（仅在开发模式）
    sourcemap: !isProd,
    // 设置 chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
    // 优化依赖预构建
    commonjsOptions: {
      include: [/node_modules/]
    }
  },
  // 开发服务器配置
  server: {
    port: 3000,
    host: true,
    // 启用 HMR
    hmr: {
      overlay: true
    }
  },
  // 预览服务器配置
  preview: {
    port: 3000,
    host: true
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react'
    ]
  }
})

