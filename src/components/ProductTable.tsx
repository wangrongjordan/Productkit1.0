// 产品表格组件 - 支持排序、选择、批量操作
import React, { useState } from 'react'
import { ChevronUp, ChevronDown, Eye, Edit, Trash2, MoreVertical } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product } from '../lib/supabase'

interface ProductTableProps {
  products: Product[]
  selectedProducts: number[]
  onSelectProduct: (productId: number) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onSort: (field: string) => void
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  loading?: boolean
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onDeselectAll,
  onEdit,
  onDelete,
  onSort,
  sortField,
  sortOrder,
  loading = false
}) => {
  const allSelected = selectedProducts.length === products.length && products.length > 0
  const someSelected = selectedProducts.length > 0 && selectedProducts.length < products.length

  const handleSelectAll = () => {
    if (allSelected) {
      onDeselectAll()
    } else {
      onSelectAll()
    }
  }

  const SortableHeader = ({ field, children }: { field: string, children: React.ReactNode }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          sortOrder === 'asc' ? 
            <ChevronUp className="w-4 h-4" /> : 
            <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </th>
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '启用'
      case 'inactive': return '停用'
      case 'draft': return '草稿'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载产品数据...</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <p className="text-gray-500">没有找到符合条件的产品</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected
                  }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <SortableHeader field="product_name">产品名称</SortableHeader>
              <SortableHeader field="product_code">产品编码</SortableHeader>
              <SortableHeader field="level_1_category">分类</SortableHeader>
              <SortableHeader field="status">状态</SortableHeader>
              <SortableHeader field="updated_at">更新时间</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr 
                key={product.id} 
                className={`hover:bg-gray-50 transition-colors ${
                  selectedProducts.includes(product.id) ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => onSelectProduct(product.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                    {product.product_name}
                  </div>
                  {product.product_features && (
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {product.product_features}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-mono">{product.product_code}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{product.level_1_category}</div>
                  {product.level_2_category && (
                    <div className="text-xs text-gray-500">
                      {product.level_2_category}
                      {product.level_3_category && ` > ${product.level_3_category}`}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    getStatusColor(product.status || 'active')
                  }`}>
                    {getStatusText(product.status || 'active')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(product.updated_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/product/${product.id}`}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onEdit(product)}
                      className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
                      title="编辑"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(product)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ProductTable