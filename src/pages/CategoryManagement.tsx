import React, { useState, useEffect } from 'react'
import { Plus, Search, Tag, Package, Download, Edit, Trash2, Eye, EyeOff, ChevronRight, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/LoadingSpinner'
import CategoryManagementService from '../lib/category-management-service'

interface Category {
  id: number
  name: string
  parent_id: number | null
  level: number
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  children?: Category[]
  product_count?: number
}

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    parent_id: null as number | null,
    level: 1,
    description: '',
    sort_order: 0
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      
      // 获取所有分类
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select('*')
        .order('level')
        .order('sort_order')
      
      if (error) throw error
      
      // 计算每个分类的产品数量
      const categoriesWithCount = await Promise.all(
        (categoriesData || []).map(async (category) => {
          // 根据分类名称查询产品数量
          const { count } = await supabase
            .from('products')
            .select('id', { count: 'exact' })
            .or(`level_1_category.eq.${category.name},level_2_category.eq.${category.name},level_3_category.eq.${category.name}`)
          
          return {
            ...category,
            product_count: count || 0
          }
        })
      )
      
      // 构建层级结构
      const categoryTree = buildCategoryTree(categoriesWithCount)
      setCategories(categoryTree)
    } catch (error) {
      console.error('Error loading categories:', error)
      alert('加载分类数据失败')
    } finally {
      setLoading(false)
    }
  }

  const buildCategoryTree = (categories: Category[]): Category[] => {
    const categoryMap = new Map<number, Category>()
    const rootCategories: Category[] = []
    
    // 初始化所有分类
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] })
    })
    
    // 构建层级关系
    categories.forEach(category => {
      const cat = categoryMap.get(category.id)!
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(cat)
        }
      } else {
        rootCategories.push(cat)
      }
    })
    
    return rootCategories
  }

  const handleAddCategory = () => {
    setFormData({
      name: '',
      parent_id: null,
      level: 1,
      description: '',
      sort_order: 0
    })
    setEditingCategory(null)
    setShowAddModal(true)
  }

  const handleEditCategory = (category: Category) => {
    setFormData({
      name: category.name,
      parent_id: category.parent_id,
      level: category.level,
      description: category.description || '',
      sort_order: category.sort_order
    })
    setEditingCategory(category)
    setShowEditModal(true)
  }

  const handleSaveCategory = async () => {
    try {
      setProcessing(true)

      if (editingCategory) {
        // 更新分类
        const result = await CategoryManagementService.updateCategory(editingCategory.id, {
          name: formData.name,
          parent_id: formData.parent_id,
          level: formData.level,
          description: formData.description || undefined,
          sort_order: formData.sort_order,
          is_active: true // 保持原有状态
        })
        
        if (result.error) {
          throw new Error(result.error.message)
        }
        
        alert('分类更新成功')
      } else {
        // 添加新分类
        const result = await CategoryManagementService.createCategory({
          name: formData.name,
          parent_id: formData.parent_id,
          level: formData.level,
          description: formData.description || undefined,
          sort_order: formData.sort_order,
          is_active: true
        })
        
        if (result.error) {
          throw new Error(result.error.message)
        }
        
        alert('分类创建成功')
      }

      setShowAddModal(false)
      setShowEditModal(false)
      loadCategories()
    } catch (error: any) {
      console.error('Error saving category:', error)
      if (error.message.includes('重复') || error.message.includes('unique')) {
        alert('分类名称已存在，请使用其他名称')
      } else {
        alert('保存失败：' + error.message)
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    if (category.product_count && category.product_count > 0) {
      alert(`该分类下还有 ${category.product_count} 个产品，无法删除`)
      return
    }

    if (category.children && category.children.length > 0) {
      alert('该分类下还有子分类，请先删除子分类')
      return
    }

    if (!confirm(`确定要删除分类 "${category.name}" 吗？此操作不可恢复。`)) {
      return
    }

    try {
      setProcessing(true)
      
      const result = await CategoryManagementService.deleteCategory(category.id, category.name)
      
      if (result.error) {
        throw new Error(result.error.message)
      }

      alert('分类删除成功')
      loadCategories()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      alert('删除失败：' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleToggleActive = async (category: Category) => {
    try {
      setProcessing(true)
      
      const result = await CategoryManagementService.toggleCategoryStatus(
        category.id, 
        category.name, 
        category.is_active
      )
      
      if (result.error) {
        throw new Error(result.error.message)
      }

      alert(`分类已${!category.is_active ? '显示' : '隐藏'}`)
      loadCategories()
    } catch (error: any) {
      console.error('Error toggling category status:', error)
      alert('操作失败：' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleExport = async () => {
    try {
      const headers = ['分类ID', '分类名称', '级别', '父级分类', '描述', '排序', '状态', '产品数量', '创建时间']
      
      const flattenCategories = (categories: Category[], result: Category[] = []): Category[] => {
        categories.forEach(category => {
          result.push(category)
          if (category.children && category.children.length > 0) {
            flattenCategories(category.children, result)
          }
        })
        return result
      }
      
      const flatCategories = flattenCategories(categories)
      
      const rows = flatCategories.map(cat => [
        cat.id,
        cat.name,
        cat.level === 1 ? '一级分类' : cat.level === 2 ? '二级分类' : '三级分类',
        cat.parent_id ? flatCategories.find(p => p.id === cat.parent_id)?.name || '' : '',
        cat.description || '',
        cat.sort_order,
        cat.is_active ? '显示' : '隐藏',
        cat.product_count || 0,
        new Date(cat.created_at).toLocaleDateString('zh-CN')
      ])
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')
      
      const BOM = '\uFEFF'
      const csvWithBOM = BOM + csvContent
      
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `产品分类数据_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('导出失败，请稍后重试')
    }
  }

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const renderCategoryRow = (category: Category, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedCategories.has(category.id)
    
    return (
      <React.Fragment key={category.id}>
        <tr className="hover:bg-gray-50">
          <td className="py-4 px-4">
            <div className="flex items-center space-x-3" style={{ paddingLeft: `${depth * 24}px` }}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(category.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              ) : (
                <div className="w-6" />
              )}
              
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="w-4 h-4 text-blue-600" />
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {category.name}
                </div>
                {category.description && (
                  <div className="text-sm text-gray-500">{category.description}</div>
                )}
              </div>
            </div>
          </td>
          
          <td className="py-4 px-4">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border bg-blue-100 text-blue-800 border-blue-200">
              {category.level === 1 ? '一级分类' : category.level === 2 ? '二级分类' : '三级分类'}
            </span>
          </td>
          
          <td className="py-4 px-4">
            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${
              category.is_active 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : 'bg-red-100 text-red-800 border-red-200'
            }`}>
              {category.is_active ? '显示' : '隐藏'}
            </span>
          </td>
          
          <td className="py-4 px-4">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900">{category.product_count || 0}</span>
            </div>
          </td>
          
          <td className="py-4 px-4">
            <div className="text-sm text-gray-900">
              {new Date(category.created_at).toLocaleDateString('zh-CN')}
            </div>
          </td>
          
          <td className="py-4 px-4 text-right">
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => handleEditCategory(category)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="编辑分类"
              >
                <Edit className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => handleToggleActive(category)}
                className={`p-2 rounded-lg transition-colors ${
                  category.is_active
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-green-600 hover:bg-green-50'
                }`}
                title={category.is_active ? '隐藏分类' : '显示分类'}
                disabled={processing}
              >
                {category.is_active ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
              
              <button
                onClick={() => handleDeleteCategory(category)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="删除分类"
                disabled={processing}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
        
        {hasChildren && isExpanded && category.children!.map(child => 
          renderCategoryRow(child, depth + 1)
        )}
      </React.Fragment>
    )
  }

  const renderModal = (isEdit: boolean) => {
    const availableParents = categories.filter(cat => {
      if (isEdit && editingCategory) {
        return cat.id !== editingCategory.id && cat.level < 3
      }
      return cat.level < 3
    })
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-md w-full m-4">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {isEdit ? '编辑分类' : '添加分类'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入分类名称"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  父级分类
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => {
                    const parentId = e.target.value ? parseInt(e.target.value) : null
                    const parent = parentId ? availableParents.find(p => p.id === parentId) : null
                    setFormData({
                      ...formData, 
                      parent_id: parentId,
                      level: parent ? parent.level + 1 : 1
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">无（一级分类）</option>
                  {availableParents.map(parent => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name} ({parent.level === 1 ? '一级' : '二级'})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入分类描述"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  排序号
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={processing || !formData.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {processing ? <LoadingSpinner size="small" /> : '保存'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">分类管理</h2>
          <p className="text-gray-600 mt-1">管理产品分类结构、层级和状态</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>导出分类</span>
          </button>
          <button
            onClick={handleAddCategory}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>添加分类</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📂</div>
            <p className="text-gray-500 text-lg">暂无分类数据</p>
            <button
              onClick={handleAddCategory}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建第一个分类
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">分类信息</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">级别</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">产品数量</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">创建时间</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map(category => renderCategoryRow(category))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && renderModal(false)}
      
      {/* Edit Modal */}
      {showEditModal && renderModal(true)}
    </div>
  )
}

export default CategoryManagement