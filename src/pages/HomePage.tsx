import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, User, Calendar, Tag, FileText, ChevronRight, ChevronDown, ArrowUpDown, LogOut, Settings, Shield } from 'lucide-react'
import { supabase, type Product } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { pinyin } from 'pinyin-pro'
import CompanyLogo from '../components/CompanyLogo'
import AuditLogService from '../lib/audit-log-service'

// 排序选项类型定义
type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc'

// 分类接口定义
interface Category {
  id: string
  name: string
  level: number
  parent_id: string | null
  sort_order: number
  children?: Category[]
}

interface CategoryStructure {
  [key: string]: {
    [key: string]: string[]
  }
}

interface GroupedProducts {
  [category: string]: Product[]
}

const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [groupedProducts, setGroupedProducts] = useState<GroupedProducts>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryStructure, setCategoryStructure] = useState<CategoryStructure>({})
  const [navigationCategories, setNavigationCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
    // 从 localStorage加载保存的排序选项
    const savedSortOption = localStorage.getItem('productSortOption') as SortOption
    if (savedSortOption && ['newest', 'oldest', 'name_asc', 'name_desc'].includes(savedSortOption)) {
      setSortOption(savedSortOption)
    }
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [searchQuery, selectedCategory, products, sortOption])

  // 记录搜索操作日志
  useEffect(() => {
    if (searchQuery.trim() && user) {
      const logSearchAction = async () => {
        try {
          await AuditLogService.logOperation({
            userId: user.id,
            userEmail: user.email || '',
            userName: profile?.full_name,
            actionType: 'SEARCH',
            operationDetails: `用户搜索产品: "${searchQuery.trim()}"`
          })
        } catch (error) {
          console.error('记录搜索日志失败:', error)
        }
      }
      
      // 防抖处理，避免频繁记录日志
      const searchTimer = setTimeout(logSearchAction, 1000)
      return () => clearTimeout(searchTimer)
    }
  }, [searchQuery, user, profile])

  // 记录分类筛选操作日志
  useEffect(() => {
    if (selectedCategory && user) {
      const logFilterAction = async () => {
        try {
          await AuditLogService.logOperation({
            userId: user.id,
            userEmail: user.email || '',
            userName: profile?.full_name,
            actionType: 'FILTER',
            operationDetails: `用户筛选产品分类: "${selectedCategory}"`
          })
        } catch (error) {
          console.error('记录筛选日志失败:', error)
        }
      }
      logFilterAction()
    }
  }, [selectedCategory, user, profile])

  // 记录排序操作日志
  useEffect(() => {
    // 只有当用户主动改变排序选项时才记录日志（跳过初始加载）
    if (user && sortOption !== 'newest') {
      const logSortAction = async () => {
        try {
          await AuditLogService.logOperation({
            userId: user.id,
            userEmail: user.email || '',
            userName: profile?.full_name,
            actionType: 'SORT',
            operationDetails: `用户更改排序方式: "${getSortOptionText(sortOption)}"`
          })
        } catch (error) {
          console.error('记录排序日志失败:', error)
        }
      }
      logSortAction()
    }
  }, [sortOption, user, profile])

  async function loadData() {
    try {
      setLoading(true)
      
      // 同时加载产品数据和分类数据
      const [productResult, categoriesResult] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('level', { ascending: true }).order('sort_order', { ascending: true })
      ])

      if (productResult.error) throw productResult.error
      if (categoriesResult.error) throw categoriesResult.error

      const productData = productResult.data || []
      const categoryData = categoriesResult.data || []

      setProducts(productData)
      setCategories(categoryData)

      // 构建分类结构
      buildCategoryStructure(categoryData)

      // 根据一级分类分组产品
      const grouped: GroupedProducts = {}
      productData.forEach(product => {
        const category = product.level_1_category
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push(product)
      })
      setGroupedProducts(grouped)

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function buildCategoryStructure(categoryData: Category[]) {
    // 分别获取各级分类
    const level1Categories = categoryData.filter(cat => cat.level === 1)
    const level2Categories = categoryData.filter(cat => cat.level === 2)
    const level3Categories = categoryData.filter(cat => cat.level === 3)

    // 设置导航分类（一级分类，排除"印刷包装基础"）
    const navCategories = level1Categories.filter(cat => cat.name !== '印刷包装基础')
    setNavigationCategories(navCategories)

    // 构建嵌套的分类结构用于展开/折叠功能
    const structure: CategoryStructure = {}
    level1Categories.forEach(level1 => {
      structure[level1.name] = {}
      const level2Items = level2Categories.filter(cat => cat.parent_id === level1.id)
      level2Items.forEach(level2 => {
        const level3Items = level3Categories.filter(cat => cat.parent_id === level2.id)
        structure[level1.name][level2.name] = level3Items.map(cat => cat.name)
      })
    })
    setCategoryStructure(structure)
  }

  // 排序功能
  const sortProducts = (products: Product[], sortOption: SortOption): Product[] => {
    const sortedProducts = [...products]
    
    switch (sortOption) {
      case 'newest':
        return sortedProducts.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      case 'oldest':
        return sortedProducts.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
      case 'name_asc':
        return sortedProducts.sort((a, b) => {
          // 使用pinyin库将中文转换为拼音进行排序
          const pinyinA = pinyin(a.product_name, { toneType: 'none', type: 'array' }).join('')
          const pinyinB = pinyin(b.product_name, { toneType: 'none', type: 'array' }).join('')
          return pinyinA.localeCompare(pinyinB, 'zh-CN')
        })
      case 'name_desc':
        return sortedProducts.sort((a, b) => {
          // 使用pinyin库将中文转换为拼音进行排序
          const pinyinA = pinyin(a.product_name, { toneType: 'none', type: 'array' }).join('')
          const pinyinB = pinyin(b.product_name, { toneType: 'none', type: 'array' }).join('')
          return pinyinB.localeCompare(pinyinA, 'zh-CN')
        })
      default:
        return sortedProducts
    }
  }

  function applyFiltersAndSort() {
    let filtered = [...products]

    // 分类筛选
    if (selectedCategory) {
      filtered = filtered.filter(product => 
        product.level_1_category.includes(selectedCategory) ||
        product.level_2_category.includes(selectedCategory) ||
        product.level_3_category.includes(selectedCategory)
      )
    }

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product => 
        product.product_name.toLowerCase().includes(query) ||
        product.level_1_category.toLowerCase().includes(query) ||
        product.level_2_category.toLowerCase().includes(query) ||
        product.level_3_category.toLowerCase().includes(query) ||
        (product.product_features && product.product_features.toLowerCase().includes(query))
      )
    }

    // 应用排序
    const sortedFiltered = sortProducts(filtered, sortOption)
    setFilteredProducts(sortedFiltered)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  const handleSortChange = (newSortOption: SortOption) => {
    setSortOption(newSortOption)
    // 保存到 localStorage
    localStorage.setItem('productSortOption', newSortOption)
  }

  const getSortOptionText = (option: SortOption): string => {
    switch (option) {
      case 'newest': return '最新优先'
      case 'oldest': return '最旧优先'
      case 'name_asc': return '名称A-Z'
      case 'name_desc': return '名称Z-A'
      default: return '最新优先'
    }
  }

  const toggleCategoryExpansion = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">正在加载产品数据...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航栏 */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <CompanyLogo size="small" className="mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">产品知识库</h1>
            </div>
            
            {/* 中央搜索栏 */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="输入产品/技术/分类等关键词"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors">
                  搜索
                </button>
              </div>
            </div>
            
            {/* 用户信息和导航 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {/* 用户角色标识 */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    {profile?.role === 'superadmin' ? (
                      <Shield className="w-4 h-4 text-red-600" />
                    ) : profile?.role === 'admin' ? (
                      <Settings className="w-4 h-4 text-blue-600" />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {profile?.full_name || user.email?.split('@')[0] || '用户'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {profile?.role === 'superadmin' ? '超级管理员' : 
                       profile?.role === 'admin' ? '管理员' : '普通用户'}
                    </div>
                  </div>
                </div>
                
                {/* 控制台链接 */}
                <Link 
                  to={profile?.role === 'admin' || profile?.role === 'superadmin' ? '/admin' : '/dashboard'}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center space-x-1"
                >
                  <Settings className="w-4 h-4" />
                  <span>控制台</span>
                </Link>
                
                {/* 登出按钮 */}
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1"
                  title="登出"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">登出</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* 左侧导航栏 */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h2 className="font-medium text-gray-900">产品分类</h2>
              </div>
              <nav className="p-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors mb-1 ${!selectedCategory ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  全部分类
                </button>
                {navigationCategories.map((category) => {
                  const categoryName = category.name
                  const isExpanded = expandedCategories.has(categoryName)
                  const subcategories = categoryStructure[categoryName] || {}
                  const hasSubcategories = Object.keys(subcategories).length > 0
                  
                  return (
                    <div key={category.id} className="mb-1">
                      <div className="flex items-center">
                        <button
                          onClick={() => setSelectedCategory(categoryName)}
                          className={`flex-1 text-left px-3 py-2 rounded-md transition-colors ${
                            selectedCategory === categoryName
                              ? 'bg-blue-100 text-blue-800 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {categoryName}
                        </button>
                        {hasSubcategories && (
                          <button
                            onClick={() => toggleCategoryExpansion(categoryName)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                      {isExpanded && hasSubcategories && (
                        <div className="ml-4 mt-1 space-y-1">
                          {Object.keys(subcategories).map((subcategory) => (
                            <button
                              key={subcategory}
                              onClick={() => setSelectedCategory(subcategory)}
                              className={`w-full text-left px-3 py-1 text-sm rounded-md transition-colors ${
                                selectedCategory === subcategory
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {subcategory}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* 主内容区域 */}
          <div className="flex-1">
            {/* 内容头部 */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedCategory ? `${selectedCategory} 相关产品` : '全部产品'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  共找到 {filteredProducts.length} 个产品
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* 排序选择器 */}
                <div className="flex items-center space-x-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">排序：</span>
                  <select
                    value={sortOption}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="newest">最新优先</option>
                    <option value="oldest">最旧优先</option>
                    <option value="name_asc">名称A-Z</option>
                    <option value="name_desc">名称Z-A</option>
                  </select>
                </div>
                
                {/* 视图切换 */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 rounded text-sm ${
                      viewMode === 'list'
                        ? 'bg-blue-100 text-blue-800'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    列表视图
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1 rounded text-sm ${
                      viewMode === 'cards'
                        ? 'bg-blue-100 text-blue-800'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    卡片视图
                  </button>
                </div>
              </div>
            </div>

            {/* 产品列表 */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📦</div>
                <p className="text-gray-500 text-lg mb-2">暂无相关产品</p>
                <p className="text-gray-400 text-sm">尝试调整搜索条件或选择其他分类</p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-4">
                {filteredProducts.map((product, index) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Link 
                            to={`/product/${product.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {product.product_name}
                          </Link>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            推荐
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>发布时间：{new Date(product.created_at).toLocaleDateString('zh-CN')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            <span>所属分类：{product.level_1_category}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>产品编码：{product.product_code}</span>
                          </div>
                        </div>
                        
                        {product.product_features && (
                          <p className="text-gray-700 leading-relaxed">
                            {product.product_features.length > 150 
                              ? `${product.product_features.substring(0, 150)}...`
                              : product.product_features
                            }
                          </p>
                        )}
                      </div>
                      
                      <div className="ml-6 flex-shrink-0">
                        {/* Removed add button */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 卡片视图 - 三级目录卡片化
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {product.level_1_category}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              推荐
                            </span>
                          </div>
                          <Link 
                            to={`/product/${product.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors block mb-2"
                          >
                            {product.product_name}
                          </Link>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-3">
                        <div className="mb-1">发布时间：{new Date(product.created_at).toLocaleDateString('zh-CN')}</div>
                        <div className="mb-1">分类：{product.level_2_category} • {product.level_3_category}</div>
                        <div>编码：{product.product_code}</div>
                      </div>
                      
                      {product.product_features && (
                        <p className="text-gray-700 text-sm leading-relaxed mb-4">
                          {product.product_features.length > 120 
                            ? `${product.product_features.substring(0, 120)}...`
                            : product.product_features
                          }
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
