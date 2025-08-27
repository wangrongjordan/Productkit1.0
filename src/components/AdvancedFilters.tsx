// 高级搜索和筛选组件
import React, { useState, useEffect } from 'react'
import { Search, Filter, X, Calendar } from 'lucide-react'
import type { ProductListParams } from '../lib/supabase'

interface AdvancedFiltersProps {
  onFilter: (params: ProductListParams) => void
  categories: string[]
  loading?: boolean
}

interface FilterState {
  search: string
  category: string
  status: string
  dateFrom: string
  dateTo: string
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  onFilter,
  categories,
  loading = false
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFilter()
    }, 300)
    
    return () => clearTimeout(timer)
  }, [filters.search])
  
  const handleFilter = () => {
    const params: ProductListParams = {
      page: 1, // 筛选时重置到第一页
      search: filters.search || undefined,
      category: filters.category || undefined,
      status: filters.status || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined
    }
    onFilter(params)
  }
  
  const handleInputChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }
  
  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    })
    onFilter({ page: 1 })
  }
  
  const hasActiveFilters = filters.category || filters.status || filters.dateFrom || filters.dateTo
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* 基本搜索 */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="搜索产品名称或编码..."
            value={filters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            disabled={loading}
          />
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`inline-flex items-center px-4 py-2 border rounded-lg font-medium transition-colors ${
            showAdvanced || hasActiveFilters
              ? 'border-blue-500 text-blue-700 bg-blue-50'
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4 mr-2" />
          高级筛选
          {hasActiveFilters && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
              !
            </span>
          )}
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            title="清除筛选条件"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* 高级筛选 */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          {/* 分类筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              产品分类
            </label>
            <select
              value={filters.category}
              onChange={(e) => {
                handleInputChange('category', e.target.value)
                handleFilter()
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
            >
              <option value="">全部分类</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* 状态筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              产品状态
            </label>
            <select
              value={filters.status}
              onChange={(e) => {
                handleInputChange('status', e.target.value)
                handleFilter()
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
            >
              <option value="">全部状态</option>
              <option value="active">启用</option>
              <option value="inactive">停用</option>
              <option value="draft">草稿</option>
            </select>
          </div>
          
          {/* 开始日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              开始日期
            </label>
            <div className="relative">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => {
                  handleInputChange('dateFrom', e.target.value)
                  handleFilter()
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={loading}
              />
            </div>
          </div>
          
          {/* 结束日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              结束日期
            </label>
            <div className="relative">
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => {
                  handleInputChange('dateTo', e.target.value)
                  handleFilter()
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={loading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedFilters