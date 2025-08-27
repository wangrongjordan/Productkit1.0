import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Package, Search, Filter, Plus, Download, Upload, History, 
  Settings, LogOut, User, Loader2 
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import CompanyLogo from '../components/CompanyLogo'
import {
  getProductList, getProductCategories, bulkUpdateProductStatus,
  bulkDeleteProducts, bulkUpdateProductFields, createProduct,
  updateProduct, deleteProduct, exportProductsToCSV, importProducts,
  submitProductChanges
} from '../lib/product-service'
import { type Product } from '../lib/supabase'

// 导入所有产品管理组件
import ProductTable from '../components/ProductTable'
import AdvancedFilters from '../components/AdvancedFilters'
import BulkOperationsBar from '../components/BulkOperationsBar'
import Pagination from '../components/Pagination'
import ProductEditModal from '../components/ProductEditModal'
import BulkEditModal from '../components/BulkEditModal'
import ImportModal from '../components/ImportModal'
import AuditLogViewer from '../components/AuditLogViewer'

interface ProductStats {
  total: number
  active: number
  inactive: number
  draft: number
}

const ProductsPage: React.FC = () => {
  // 状态管理
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ProductStats>({ total: 0, active: 0, inactive: 0, draft: 0 })
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [sortField, setSortField] = useState('updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // 模态框状态
  const [showProductModal, setShowProductModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showLogViewer, setShowLogViewer] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  // 其他状态
  const [refreshKey, setRefreshKey] = useState(0)
  
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  // 权限检查
  useEffect(() => {
    if (!user || !profile) {
      navigate('/admin-login')
      return
    }
    
    if (profile.role !== 'admin' && profile.role !== 'superadmin') {
      alert('您没有访问产品管理的权限')
      navigate('/')
      return
    }

    loadInitialData()
  }, [user, profile, navigate])

  // 当搜索、筛选、排序、分页参数改变时重新加载产品
  useEffect(() => {
    if (user && profile) {
      loadProducts()
    }
  }, [currentPage, pageSize, searchQuery, categoryFilter, statusFilter, dateFromFilter, dateToFilter, sortField, sortOrder, refreshKey])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadCategories(),
        loadStats()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
      alert('加载数据失败，请刷新页面重试')
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      const result = await getProductList({
        page: currentPage,
        pageSize,
        search: searchQuery,
        category: categoryFilter,
        status: statusFilter,
        dateFrom: dateFromFilter,
        dateTo: dateToFilter,
        sortBy: sortField,
        sortOrder
      })

      setProducts(result.products)
      setTotalProducts(result.total)
      setTotalPages(result.totalPages)
    } catch (error) {
      console.error('Error loading products:', error)
      alert('加载产品数据失败')
    } finally {
      setLoading(false)
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

  const loadStats = async () => {
    try {
      // 这里可以优化为单个API调用，暂时使用多个查询
      const [totalResult, activeResult, inactiveResult, draftResult] = await Promise.all([
        getProductList({ pageSize: 1 }),
        getProductList({ pageSize: 1, status: 'active' }),
        getProductList({ pageSize: 1, status: 'inactive' }),
        getProductList({ pageSize: 1, status: 'draft' })
      ])

      setStats({
        total: totalResult.total,
        active: activeResult.total,
        inactive: inactiveResult.total,
        draft: draftResult.total
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // 重置到第一页
  }

  const handleFilter = (filters: any) => {
    setCategoryFilter(filters.category || '')
    setStatusFilter(filters.status || '')
    setDateFromFilter(filters.dateFrom || '')
    setDateToFilter(filters.dateTo || '')
    setCurrentPage(1) // 重置到第一页
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const handleProductSelect = (productId: number) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }

  const handleSelectAll = () => {
    setSelectedProducts(products.map(p => p.id))
  }

  const handleDeselectAll = () => {
    setSelectedProducts([])
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowProductModal(true)
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`确定要删除产品 "${product.product_name}" 吗？`)) {
      return
    }

    try {
      await deleteProduct(product.id, {
        id: user?.id,
        email: user?.email || '',
        name: profile?.full_name
      })
      setRefreshKey(prev => prev + 1) // 触发重新加载
      alert('删除成功')
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('删除失败，请稍后再试')
    }
  }

  const handleAddNew = () => {
    setEditingProduct(null)
    setShowProductModal(true)
  }

  const handleBulkOperation = async (operation: string, data?: any) => {
    if (selectedProducts.length === 0) {
      alert('请先选择要操作的产品')
      return
    }

    const userInfo = {
      id: user?.id,
      email: user?.email || '',
      name: profile?.full_name
    }

    try {
      switch (operation) {
        case 'delete':
          if (!confirm(`确定要删除选中的 ${selectedProducts.length} 个产品吗？`)) return
          await bulkDeleteProducts(selectedProducts, userInfo)
          alert('批量删除成功')
          break
        case 'activate':
          await bulkUpdateProductStatus(selectedProducts, 'active', userInfo)
          alert('批量启用成功')
          break
        case 'deactivate':
          await bulkUpdateProductStatus(selectedProducts, 'inactive', userInfo)
          alert('批量停用成功')
          break
        case 'draft':
          await bulkUpdateProductStatus(selectedProducts, 'draft', userInfo)
          alert('批量设为草稿成功')
          break
        case 'bulk_edit':
          setShowBulkEditModal(true)
          return // 不清除选择，因为模态框还需要用到
        default:
          console.warn('Unknown bulk operation:', operation)
          return
      }
      
      setSelectedProducts([])
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Bulk operation error:', error)
      alert('操作失败，请稍后再试')
    }
  }

  const handleProductSaved = () => {
    setShowProductModal(false)
    setEditingProduct(null)
    setRefreshKey(prev => prev + 1)
  }

  const handleBulkEditSaved = () => {
    setShowBulkEditModal(false)
    setSelectedProducts([])
    setRefreshKey(prev => prev + 1)
  }

  const handleImportComplete = () => {
    setShowImportModal(false)
    setRefreshKey(prev => prev + 1)
  }

  const handleExport = async () => {
    try {
      await exportProductsToCSV({
        search: searchQuery,
        category: categoryFilter,
        status: statusFilter,
        dateFrom: dateFromFilter,
        dateTo: dateToFilter
      })
    } catch (error) {
      console.error('Export error:', error)
      alert('导出失败，请稍后再试')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <CompanyLogo size="small" />
              <Link to="/" className="text-xl font-semibold text-gray-900 hover:text-apple-blue transition-colors">
                产品知识库
              </Link>
              <span className="text-gray-400">|</span>
              <div className="flex items-center space-x-2 text-apple-blue">
                <Package className="w-5 h-5" />
                <span className="font-medium">产品管理</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">{profile.full_name || user.email}</span>
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">产品维护管理</h1>
          <p className="text-gray-600">管理您的产品信息，支持批量操作、数据导入导出和操作审计</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="apple-card">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">产品总数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-apple-blue-bg rounded-lg">
                <Package className="w-6 h-6 text-apple-blue" />
              </div>
            </div>
          </div>
          
          <div className="apple-card">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">启用中</p>
                <p className="text-2xl font-bold text-apple-success">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-apple-success rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="apple-card">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">已停用</p>
                <p className="text-2xl font-bold text-apple-error">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <div className="w-6 h-6 bg-apple-error rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="apple-card">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">草稿</p>
                <p className="text-2xl font-bold text-apple-warning">{stats.draft}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <div className="w-6 h-6 bg-apple-warning rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="搜索产品名称或编码..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="apple-input pl-10"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleAddNew}
                className="apple-button flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>新增产品</span>
              </button>
              
              <button
                onClick={() => setShowImportModal(true)}
                className="apple-button-secondary flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>导入</span>
              </button>
              
              <button
                onClick={handleExport}
                className="apple-button-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>导出</span>
              </button>
              
              <button
                onClick={() => setShowLogViewer(true)}
                className="apple-button-secondary flex items-center space-x-2"
              >
                <History className="w-4 h-4" />
                <span>操作日志</span>
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          categories={categories}
          onFilter={handleFilter}
          loading={loading}
        />

        {/* Bulk Operations Bar */}
        {selectedProducts.length > 0 && (
          <BulkOperationsBar
            selectedCount={selectedProducts.length}
            onBulkStatusUpdate={(status) => handleBulkOperation(status)}
            onBulkDelete={() => handleBulkOperation('delete')}
            onBulkEdit={() => handleBulkOperation('bulk_edit')}
            onExport={handleExport}
            onImport={() => setShowImportModal(true)}
            onClearSelection={handleDeselectAll}
          />
        )}

        {/* Products Table */}
        <ProductTable
          products={products}
          selectedProducts={selectedProducts}
          onSelectProduct={handleProductSelect}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSort={handleSort}
          sortField={sortField}
          sortOrder={sortOrder}
          loading={loading}
        />

        {/* Pagination */}
        {!loading && products.length > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              totalItems={totalProducts}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showProductModal && (
        <ProductEditModal
          product={editingProduct}
          isOpen={showProductModal}
          onSave={async (productData) => {
            try {
              if (editingProduct) {
                // 如果是管理员，提交到审批队列
                if (profile?.role === 'admin') {
                  const result = await submitProductChanges(
                    editingProduct.id,
                    productData,
                    {
                      id: user?.id || '',
                      email: user?.email || '',
                      name: profile?.full_name
                    }
                  )
                  
                  if (result.success) {
                    alert('修改申请已提交，等待超级管理员审批')
                  } else {
                    throw new Error(result.error || '提交失败')
                  }
                } else {
                  // 超级管理员直接更新
                  await updateProduct(editingProduct.id, productData, {
                    id: user?.id,
                    email: user?.email || '',
                    name: profile?.full_name
                  })
                }
              } else {
                await createProduct(productData, {
                  id: user?.id,
                  email: user?.email || '',
                  name: profile?.full_name
                })
              }
              handleProductSaved()
            } catch (error) {
              console.error('Error saving product:', error)
              throw error
            }
          }}
          onClose={() => {
            setShowProductModal(false)
            setEditingProduct(null)
          }}
        />
      )}

      {showBulkEditModal && (
        <BulkEditModal
          selectedCount={selectedProducts.length}
          isOpen={showBulkEditModal}
          onSave={async (updateData) => {
            try {
              await bulkUpdateProductFields(selectedProducts, updateData, {
                id: user?.id,
                email: user?.email || '',
                name: profile?.full_name
              })
              handleBulkEditSaved()
            } catch (error) {
              console.error('Error in bulk edit:', error)
              throw error
            }
          }}
          onClose={() => setShowBulkEditModal(false)}
        />
      )}

      {showImportModal && (
        <ImportModal
          isOpen={showImportModal}
          onImport={async (data) => {
            try {
              const result = await importProducts(data, {
                id: user?.id,
                email: user?.email || '',
                full_name: profile?.full_name
              })
              
              // 显示导入结果
              if (result.success) {
                const { successCount, errorCount } = result.results || { successCount: 0, errorCount: 0 }
                if (errorCount > 0) {
                  alert(`导入完成！成功: ${successCount}条，失败: ${errorCount}条`)
                } else {
                  alert(`导入成功！共导入 ${successCount} 条数据`)
                }
                handleImportComplete()
              } else {
                const errorMessages = result.errors?.join(', ') || '未知错误'
                alert(`导入失败: ${errorMessages}`)
              }
              
              return result
            } catch (error: any) {
              console.error('Import error:', error)
              alert(`导入失败: ${error.message}`)
              return {
                success: false,
                errors: [error.message]
              }
            }
          }}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {showLogViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">操作日志</h2>
              <button
                onClick={() => setShowLogViewer(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <AuditLogViewer />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsPage