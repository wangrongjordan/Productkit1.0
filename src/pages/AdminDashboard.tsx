import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Shield, Users, Package, BarChart3, Settings, LogOut, Plus, 
  Download, Upload, History, AlertTriangle 
} from 'lucide-react'
import { supabase, type Product, type Profile, type ProductCategory } from '../lib/supabase'
import { 
  getProductList, getProductCategories, bulkUpdateProductStatus, 
  bulkDeleteProducts, bulkUpdateProductFields, createProduct, 
  updateProduct, deleteProduct, exportProductsToCSV
} from '../lib/product-service'
import { useAuth } from '../contexts/AuthContext'
import CompanyLogo from '../components/CompanyLogo'

// 导入新组件
import ProductTable from '../components/ProductTable'
import AdvancedFilters from '../components/AdvancedFilters'
import BulkOperationsBar from '../components/BulkOperationsBar'
import Pagination from '../components/Pagination'
import ProductEditModal from '../components/ProductEditModal'
import BulkEditModal from '../components/BulkEditModal'
import ImportModal from '../components/ImportModal'
import AuditLogViewer from '../components/AuditLogViewer'
import ApprovalManagement from './ApprovalManagement'
import UserManagement from './UserManagement'
import CategoryManagement from './CategoryManagement'
import SystemSettings from './SystemSettings'

interface DashboardStats {
  totalProducts: number
  totalCategories: number
  totalUsers: number
  adminUsers: number
  activeProducts: number
  inactiveProducts: number
  draftProducts: number
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalUsers: 0,
    adminUsers: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    draftProducts: 0
  })
  
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'users' | 'categories' | 'logs' | 'approval' | 'settings'>('products')
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // 搜索和筛选状态
  const [searchParams, setSearchParams] = useState({})
  const [sortField, setSortField] = useState('updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // 模态框状态
  const [showProductModal, setShowProductModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || !profile) {
      navigate('/admin-login')
      return
    }
    
    if (profile.role !== 'admin' && profile.role !== 'superadmin') {
      alert('您没有管理员权限')
      navigate('/')
      return
    }

    loadInitialData()
  }, [user, profile, navigate])

  useEffect(() => {
    if (activeTab === 'products') {
      loadProducts()
    }
  }, [currentPage, pageSize, searchParams, sortField, sortOrder, activeTab])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadDashboardStats(),
        loadCategories()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardStats = async () => {
    try {
      // 获取产品统计
      const [productsCount, usersCount, activeCount, inactiveCount, draftCount] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('products').select('id', { count: 'exact' }).eq('status', 'inactive'),
        supabase.from('products').select('id', { count: 'exact' }).eq('status', 'draft')
      ])

      const { count: adminCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .in('role', ['admin', 'superadmin'])

      setStats({
        totalProducts: productsCount.count || 0,
        totalCategories: 0, // 暂时设为0，因为分类表可能不存在
        totalUsers: usersCount.count || 0,
        adminUsers: adminCount || 0,
        activeProducts: activeCount.count || 0,
        inactiveProducts: inactiveCount.count || 0,
        draftProducts: draftCount.count || 0
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const cats = await getProductCategories()
      setCategories(cats)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      const result = await getProductList({
        page: currentPage,
        pageSize,
        sortBy: sortField,
        sortOrder,
        ...searchParams
      })
      
      setProducts(result.products)
      setTotalProducts(result.total)
      setTotalPages(result.totalPages)
    } catch (error) {
      console.error('Error loading products:', error)
      alert('加载产品列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  // 产品选择相关
  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSelectAll = () => {
    setSelectedProducts(products.map(p => p.id))
  }

  const handleDeselectAll = () => {
    setSelectedProducts([])
  }

  // 筛选和排序
  const handleFilter = (params: any) => {
    setSearchParams(params)
    setCurrentPage(1)
    setSelectedProducts([])
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
    setSelectedProducts([])
  }

  // 产品编辑相关
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowProductModal(true)
  }

  const handleNewProduct = () => {
    setEditingProduct(null)
    setShowProductModal(true)
  }

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      const userInfo = {
        id: user?.id,
        email: user?.email || '',
        full_name: profile?.full_name || ''
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData, userInfo)
      } else {
        await createProduct(productData, userInfo)
      }

      setShowProductModal(false)
      setEditingProduct(null)
      await Promise.all([loadProducts(), loadDashboardStats()])
      alert(editingProduct ? '产品更新成功' : '产品创建成功')
    } catch (error: any) {
      console.error('Error saving product:', error)
      alert(`保存失败：${error.message}`)
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`确定要删除产品 "${product.product_name}" 吗？`)) {
      return
    }

    try {
      const userInfo = {
        id: user?.id,
        email: user?.email || '',
        full_name: profile?.full_name || ''
      }

      await deleteProduct(product.id, userInfo)
      await Promise.all([loadProducts(), loadDashboardStats()])
      alert('产品删除成功')
    } catch (error: any) {
      console.error('Error deleting product:', error)
      alert(`删除失败：${error.message}`)
    }
  }

  // 批量操作相关
  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedProducts.length === 0) return

    try {
      const userInfo = {
        id: user?.id,
        email: user?.email || '',
        full_name: profile?.full_name || ''
      }

      const result = await bulkUpdateProductStatus(selectedProducts, status, userInfo)
      
      if (result.success) {
        alert(`成功更新 ${result.affectedCount} 个产品状态`)
        setSelectedProducts([])
        await Promise.all([loadProducts(), loadDashboardStats()])
      }
    } catch (error: any) {
      console.error('Error in bulk status update:', error)
      alert(`批量更新失败：${error.message}`)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return

    if (!confirm(`确定要删除选中的 ${selectedProducts.length} 个产品吗？此操作不可恢复。`)) {
      return
    }

    try {
      const userInfo = {
        id: user?.id,
        email: user?.email || '',
        full_name: profile?.full_name || ''
      }

      const result = await bulkDeleteProducts(selectedProducts, userInfo)
      
      if (result.success) {
        alert(`成功删除 ${result.affectedCount} 个产品`)
        setSelectedProducts([])
        await Promise.all([loadProducts(), loadDashboardStats()])
      }
    } catch (error: any) {
      console.error('Error in bulk delete:', error)
      alert(`批量删除失败：${error.message}`)
    }
  }

  const handleBulkEdit = () => {
    if (selectedProducts.length === 0) return
    setShowBulkEditModal(true)
  }

  const handleBulkEditSave = async (updateData: Record<string, any>) => {
    try {
      const userInfo = {
        id: user?.id,
        email: user?.email || '',
        full_name: profile?.full_name || ''
      }

      const result = await bulkUpdateProductFields(selectedProducts, updateData, userInfo)
      
      if (result.success) {
        alert(`成功更新 ${result.affectedCount} 个产品`)
        setSelectedProducts([])
        setShowBulkEditModal(false)
        await Promise.all([loadProducts(), loadDashboardStats()])
      }
    } catch (error: any) {
      console.error('Error in bulk edit:', error)
      alert(`批量编辑失败：${error.message}`)
    }
  }

  // 导入导出相关
  const handleExport = async () => {
    try {
      await exportProductsToCSV()
    } catch (error) {
      console.error('Error exporting products:', error)
      alert('导出失败，请稍后再试')
    }
  }

  const handleImport = async (data: any[]) => {
    try {
      // 这里应该实现实际的导入逻辑
      // 目前只是模拟处理
      const successCount = data.length
      
      const userInfo = {
        id: user?.id,
        email: user?.email || '',
        full_name: profile?.full_name || ''
      }
      
      // 记录导入日志（模拟）
      console.log('Import completed:', { data, userInfo })
      
      // 刷新数据
      await Promise.all([loadProducts(), loadDashboardStats()])
      
      return {
        success: true,
        results: {
          totalRows: data.length,
          successCount: successCount,
          errorCount: 0
        }
      }
    } catch (error: any) {
      console.error('Error importing products:', error)
      return {
        success: false,
        errors: [error.message]
      }
    }
  }

  if (!user || !profile) {
    return null
  }

  if (loading && activeTab === 'overview') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载管理控制台...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CompanyLogo size="small" />
                <Link to="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  产品知识库
                </Link>
              </div>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600 font-medium">管理控制台</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{profile.full_name || user.email}</div>
                  <div className="text-xs text-blue-600 capitalize">{profile.role === 'superadmin' ? '超级管理员' : '管理员'}</div>
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">退出</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            产品管理控制台
          </h1>
          <p className="text-gray-600">
            欢迎使用产品知识平台管理系统，{profile.full_name || '管理员'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { key: 'products', label: '产品管理', icon: Package },
              { key: 'overview', label: '数据概览', icon: BarChart3 },
              ...(profile?.role === 'superadmin' ? [{ key: 'approval', label: '审批管理', icon: AlertTriangle }] : []),
              { key: 'logs', label: '操作日志', icon: History },
              ...(profile?.role === 'superadmin' ? [{ key: 'users', label: '用户管理', icon: Users }] : []),
              ...(profile?.role === 'superadmin' ? [{ key: 'categories', label: '分类管理', icon: Package }] : []),
              ...(profile?.role === 'superadmin' ? [{ key: 'settings', label: '系统设置', icon: Settings }] : [])
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* 操作栏 */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">产品管理</h2>
              <button
                onClick={handleNewProduct}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>新增产品</span>
              </button>
            </div>

            {/* 高级筛选 */}
            <AdvancedFilters
              onFilter={handleFilter}
              categories={categories}
              loading={loading}
            />

            {/* 批量操作栏 */}
            <BulkOperationsBar
              selectedCount={selectedProducts.length}
              onBulkStatusUpdate={handleBulkStatusUpdate}
              onBulkDelete={handleBulkDelete}
              onBulkEdit={handleBulkEdit}
              onExport={handleExport}
              onImport={() => setShowImportModal(true)}
              onClearSelection={handleDeselectAll}
            />

            {/* 产品表格 */}
            <ProductTable
              products={products}
              selectedProducts={selectedProducts}
              onSelectProduct={handleSelectProduct}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onSort={handleSort}
              sortField={sortField}
              sortOrder={sortOrder}
              loading={loading}
            />

            {/* 分页 */}
            {totalProducts > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalProducts}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize)
                  setCurrentPage(1)
                }}
              />
            )}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-gray-900">数据概览</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 border border-blue-200">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-blue-900">{stats.totalProducts}</div>
                    <div className="text-blue-700">产品总数</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6 border border-green-200">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-green-900">{stats.activeProducts}</div>
                    <div className="text-green-700">启用产品</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6 border border-red-200">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-full">
                    <Package className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-red-900">{stats.inactiveProducts}</div>
                    <div className="text-red-700">停用产品</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6 border border-yellow-200">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Package className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-yellow-900">{stats.draftProducts}</div>
                    <div className="text-yellow-700">草稿产品</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6 border border-purple-200">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-purple-900">{stats.totalUsers}</div>
                    <div className="text-purple-700">用户总数</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6 border border-indigo-200">
                <div className="flex items-center">
                  <div className="p-3 bg-indigo-100 rounded-full">
                    <Shield className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-indigo-900">{stats.adminUsers}</div>
                    <div className="text-indigo-700">管理员</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div>
            <AuditLogViewer />
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && profile?.role === 'superadmin' && (
          <UserManagement />
        )}
        
        {/* Users Tab - Not Authorized */}
        {activeTab === 'users' && profile?.role !== 'superadmin' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">权限不足</h3>
            <p className="text-gray-600">用户管理功能仅限超级管理员使用</p>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && profile?.role === 'superadmin' && (
          <CategoryManagement />
        )}
        
        {/* Categories Tab - Not Authorized */}
        {activeTab === 'categories' && profile?.role !== 'superadmin' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">权限不足</h3>
            <p className="text-gray-600">分类管理功能仅限超级管理员使用</p>
          </div>
        )}
        
        {/* Approval Tab */}
        {activeTab === 'approval' && profile?.role === 'superadmin' && (
          <ApprovalManagement />
        )}
        
        {/* System Settings Tab */}
        {activeTab === 'settings' && profile?.role === 'superadmin' && (
          <SystemSettings />
        )}
        
        {/* System Settings Tab - Not Authorized */}
        {activeTab === 'settings' && profile?.role !== 'superadmin' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">权限不足</h3>
            <p className="text-gray-600">系统设置功能仅限超级管理员使用</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProductEditModal
        product={editingProduct}
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false)
          setEditingProduct(null)
        }}
        onSave={handleSaveProduct}
      />

      <BulkEditModal
        selectedCount={selectedProducts.length}
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        onSave={handleBulkEditSave}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />
    </div>
  )
}

export default AdminDashboard