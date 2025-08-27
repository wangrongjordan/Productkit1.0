// 产品编辑模态框组件
import React, { useState, useEffect } from 'react'
import { X, Save, Loader } from 'lucide-react'
import type { Product } from '../lib/supabase'

interface ProductEditModalProps {
  product?: Product | null
  isOpen: boolean
  onClose: () => void
  onSave: (productData: Partial<Product>) => Promise<void>
  loading?: boolean
}

const ProductEditModal: React.FC<ProductEditModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    product_name: '',
    product_code: '',
    level_1_category: '',
    level_2_category: '',
    level_3_category: '',
    product_features: '',
    size: '',
    style: '',
    material: '',
    color: '',
    minimum_order: '',
    printing_method: '',
    post_processing: '',
    accessories: '',
    customization_area: '',
    pricing_format: '',
    design_order: '',
    note_format: '',
    weight_specs: '',
    packaging_method: '',
    delivery_time: '',
    shipping_location_outsource: '',
    positioning_usage: '',
    selling_points: '',
    supports_custom_specs: false,
    has_physical_sample: false,
    supports_sample_viewing: false,
    is_customizable: false,
    status: 'active'
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  
  // 初始化表单数据
  useEffect(() => {
    if (product) {
      setFormData({
        product_name: product.product_name || '',
        product_code: product.product_code || '',
        level_1_category: product.level_1_category || '',
        level_2_category: product.level_2_category || '',
        level_3_category: product.level_3_category || '',
        product_features: product.product_features || '',
        size: product.size || '',
        style: product.style || '',
        material: product.material || '',
        color: product.color || '',
        minimum_order: product.minimum_order || '',
        printing_method: product.printing_method || '',
        post_processing: product.post_processing || '',
        accessories: product.accessories || '',
        customization_area: product.customization_area || '',
        pricing_format: product.pricing_format || '',
        design_order: product.design_order || '',
        note_format: product.note_format || '',
        weight_specs: product.weight_specs || '',
        packaging_method: product.packaging_method || '',
        delivery_time: product.delivery_time || '',
        shipping_location_outsource: product.shipping_location_outsource || '',
        positioning_usage: product.positioning_usage || '',
        selling_points: product.selling_points || '',
        supports_custom_specs: product.supports_custom_specs || false,
        has_physical_sample: product.has_physical_sample || false,
        supports_sample_viewing: product.supports_sample_viewing || false,
        is_customizable: product.is_customizable || false,
        status: product.status || 'active'
      })
    } else {
      // 新增产品时重置表单
      setFormData({
        product_name: '',
        product_code: '',
        level_1_category: '',
        level_2_category: '',
        level_3_category: '',
        product_features: '',
        size: '',
        style: '',
        material: '',
        color: '',
        minimum_order: '',
        printing_method: '',
        post_processing: '',
        accessories: '',
        customization_area: '',
        pricing_format: '',
        design_order: '',
        note_format: '',
        weight_specs: '',
        packaging_method: '',
        delivery_time: '',
        shipping_location_outsource: '',
        positioning_usage: '',
        selling_points: '',
        supports_custom_specs: false,
        has_physical_sample: false,
        supports_sample_viewing: false,
        is_customizable: false,
        status: 'active'
      })
    }
    setErrors({})
  }, [product, isOpen])
  
  const handleInputChange = (field: keyof Product, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.product_name?.trim()) {
      newErrors.product_name = '产品名称不能为空'
    }
    
    if (!formData.product_code?.trim()) {
      newErrors.product_code = '产品编码不能为空'
    }
    
    if (!formData.level_1_category?.trim()) {
      newErrors.level_1_category = '一级分类不能为空'
    }
    
    if (!formData.level_2_category?.trim()) {
      newErrors.level_2_category = '二级分类不能为空'
    }
    
    if (!formData.level_3_category?.trim()) {
      newErrors.level_3_category = '三级分类不能为空'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSave = async () => {
    if (!validateForm()) {
      return
    }
    
    try {
      setSaving(true)
      await onSave(formData)
    } catch (error) {
      console.error('Error saving product:', error)
    } finally {
      setSaving(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {product ? '编辑产品' : '新增产品'}
          </h3>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 内容 */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 border-b pb-2">基本信息</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  产品名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.product_name || ''}
                  onChange={(e) => handleInputChange('product_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                    errors.product_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="请输入产品名称"
                />
                {errors.product_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.product_name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  产品编码 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.product_code || ''}
                  onChange={(e) => handleInputChange('product_code', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                    errors.product_code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="请输入产品编码"
                />
                {errors.product_code && (
                  <p className="mt-1 text-sm text-red-600">{errors.product_code}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    一级分类 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.level_1_category || ''}
                    onChange={(e) => handleInputChange('level_1_category', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.level_1_category ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="请输入一级分类"
                  />
                  {errors.level_1_category && (
                    <p className="mt-1 text-sm text-red-600">{errors.level_1_category}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    二级分类 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.level_2_category || ''}
                    onChange={(e) => handleInputChange('level_2_category', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.level_2_category ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="请输入二级分类"
                  />
                  {errors.level_2_category && (
                    <p className="mt-1 text-sm text-red-600">{errors.level_2_category}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    三级分类 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.level_3_category || ''}
                    onChange={(e) => handleInputChange('level_3_category', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                      errors.level_3_category ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="请输入三级分类"
                  />
                  {errors.level_3_category && (
                    <p className="mt-1 text-sm text-red-600">{errors.level_3_category}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  产品特性
                </label>
                <textarea
                  value={formData.product_features || ''}
                  onChange={(e) => handleInputChange('product_features', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="请输入产品特性描述"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  产品状态
                </label>
                <select
                  value={formData.status || 'active'}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="active">启用</option>
                  <option value="inactive">停用</option>
                  <option value="draft">草稿</option>
                </select>
              </div>
            </div>
            
            {/* 详细信息 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 border-b pb-2">详细信息</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">尺寸</label>
                  <input
                    type="text"
                    value={formData.size || ''}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">款式</label>
                  <input
                    type="text"
                    value={formData.style || ''}
                    onChange={(e) => handleInputChange('style', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">材质</label>
                  <input
                    type="text"
                    value={formData.material || ''}
                    onChange={(e) => handleInputChange('material', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">颜色</label>
                  <input
                    type="text"
                    value={formData.color || ''}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">起订量</label>
                  <input
                    type="text"
                    value={formData.minimum_order || ''}
                    onChange={(e) => handleInputChange('minimum_order', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品重量</label>
                  <input
                    type="text"
                    value={formData.weight_specs || ''}
                    onChange={(e) => handleInputChange('weight_specs', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              
              {/* 布尔属性 */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-700">产品属性</h5>
                
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.supports_custom_specs || false}
                      onChange={(e) => handleInputChange('supports_custom_specs', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">支持特殊尺寸和数量</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.has_physical_sample || false}
                      onChange={(e) => handleInputChange('has_physical_sample', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">有实物样品</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.supports_sample_viewing || false}
                      onChange={(e) => handleInputChange('supports_sample_viewing', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">支持看样</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_customizable || false}
                      onChange={(e) => handleInputChange('is_customizable', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">支持定制</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 底部操作 */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
          >
            {saving && <Loader className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductEditModal