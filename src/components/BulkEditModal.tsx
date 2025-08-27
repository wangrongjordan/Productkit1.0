// 批量编辑模态框组件
import React, { useState } from 'react'
import { X, Save, Loader } from 'lucide-react'
import type { Product } from '../lib/supabase'

interface BulkEditModalProps {
  selectedCount: number
  isOpen: boolean
  onClose: () => void
  onSave: (updateData: Record<string, any>) => Promise<void>
  loading?: boolean
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({
  selectedCount,
  isOpen,
  onClose,
  onSave,
  loading = false
}) => {
  const [updateData, setUpdateData] = useState<Record<string, any>>({})
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  
  const fieldOptions = [
    { key: 'level_1_category', label: '一级分类', type: 'text' },
    { key: 'level_2_category', label: '二级分类', type: 'text' },
    { key: 'level_3_category', label: '三级分类', type: 'text' },
    { key: 'material', label: '材质', type: 'text' },
    { key: 'color', label: '颜色', type: 'text' },
    { key: 'minimum_order', label: '起订量', type: 'text' },
    { key: 'printing_method', label: '印刷方式', type: 'text' },
    { key: 'post_processing', label: '后道工艺', type: 'text' },
    { key: 'packaging_method', label: '包装方式', type: 'text' },
    { key: 'delivery_time', label: '发货时效', type: 'text' },
    { key: 'status', label: '产品状态', type: 'select', options: [
      { value: 'active', label: '启用' },
      { value: 'inactive', label: '停用' },
      { value: 'draft', label: '草稿' }
    ]},
    { key: 'supports_custom_specs', label: '支持特殊尺寸', type: 'boolean' },
    { key: 'has_physical_sample', label: '有实物样品', type: 'boolean' },
    { key: 'supports_sample_viewing', label: '支持看样', type: 'boolean' },
    { key: 'is_customizable', label: '支持定制', type: 'boolean' }
  ]
  
  const handleFieldToggle = (fieldKey: string) => {
    const newSelected = new Set(selectedFields)
    if (newSelected.has(fieldKey)) {
      newSelected.delete(fieldKey)
      const newUpdateData = { ...updateData }
      delete newUpdateData[fieldKey]
      setUpdateData(newUpdateData)
    } else {
      newSelected.add(fieldKey)
    }
    setSelectedFields(newSelected)
  }
  
  const handleFieldValueChange = (fieldKey: string, value: any) => {
    setUpdateData(prev => ({ ...prev, [fieldKey]: value }))
  }
  
  const handleSave = async () => {
    if (selectedFields.size === 0) {
      alert('请至少选择一个字段进行更新')
      return
    }
    
    try {
      setSaving(true)
      
      // 只提交选中的字段
      const filteredData: Record<string, any> = {}
      selectedFields.forEach(field => {
        if (updateData.hasOwnProperty(field)) {
          filteredData[field] = updateData[field]
        }
      })
      
      await onSave(filteredData)
      
      // 清理表单
      setSelectedFields(new Set())
      setUpdateData({})
    } catch (error) {
      console.error('Error in bulk edit:', error)
    } finally {
      setSaving(false)
    }
  }
  
  const renderFieldInput = (field: any) => {
    const isSelected = selectedFields.has(field.key)
    
    if (!isSelected) return null
    
    switch (field.type) {
      case 'select':
        return (
          <select
            value={updateData[field.key] || ''}
            onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">请选择</option>
            {field.options?.map((option: any) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        )
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={field.key}
                value="true"
                checked={updateData[field.key] === true}
                onChange={() => handleFieldValueChange(field.key, true)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">是</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={field.key}
                value="false"
                checked={updateData[field.key] === false}
                onChange={() => handleFieldValueChange(field.key, false)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">否</span>
            </label>
          </div>
        )
      
      default:
        return (
          <input
            type="text"
            value={updateData[field.key] || ''}
            onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder={`请输入${field.label}`}
          />
        )
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            批量编辑 ({selectedCount} 个产品)
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
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              选择要更新的字段，然后设置新的值。所选产品的相应字段将被统一更新。
            </p>
          </div>
          
          <div className="space-y-4">
            {fieldOptions.map(field => (
              <div key={field.key} className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    checked={selectedFields.has(field.key)}
                    onChange={() => handleFieldToggle(field.key)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">{field.label}</span>
                </label>
                
                {renderFieldInput(field)}
              </div>
            ))}
          </div>
        </div>
        
        {/* 底部操作 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            将更新 {selectedCount} 个产品的 {selectedFields.size} 个字段
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving || selectedFields.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {saving && <Loader className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              {saving ? '更新中...' : '批量更新'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkEditModal