import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

// 懒加载页面组件
const HomePage = React.lazy(() => import('./pages/HomePage'))
const Login = React.lazy(() => import('./pages/Login'))
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'))
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'))
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'))
const ProductsPage = React.lazy(() => import('./pages/ProductsPage'))
const ApprovalManagement = React.lazy(() => import('./pages/ApprovalManagement'))
const CategoryManagement = React.lazy(() => import('./pages/CategoryManagement'))
const UserManagement = React.lazy(() => import('./pages/UserManagement'))
const SystemSettings = React.lazy(() => import('./pages/SystemSettings'))

// 加载组件
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner size="large" />
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-white">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* 公开路由（不需认证） */}
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                
                {/* 受保护路由（需要登录） */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                } />
                
                <Route path="/product/:id" element={
                  <ProtectedRoute>
                    <ProductDetail />
                  </ProtectedRoute>
                } />
                
                {/* 普通用户和以上可访问 */}
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['user', 'admin', 'superadmin']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                {/* 管理员和以上可访问 */}
                <Route path="/dashboard/products" element={
                  <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                    <ProductsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/categories" element={
                  <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                    <CategoryManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/settings" element={
                  <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                    <SystemSettings />
                  </ProtectedRoute>
                } />
                
                {/* 超级管理员专用路由 */}
                <Route path="/admin/approval" element={
                  <ProtectedRoute requiredRole="superadmin">
                    <ApprovalManagement />
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
