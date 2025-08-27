// 批量操作工具栏组件
import React, { useState } from 'react'
import { Trash2, Edit, RotateCcw, Download, Upload } from 'lucide-react'

interface BulkOperationsBarProps {
  selectedCount: number
  onBulkStatusUpdate: (status: string) => void
  onBulkDelete: () => void
  onBulkEdit: () => void
  onExport: () => void
  onImport: () => void
  onClearSelection: () => void
}

const BulkOperationsBar: React.FC<BulkOperationsBarProps> = ({
  selectedCount,
  onBulkStatusUpdate,
  onBulkDelete,
  onBulkEdit,
  onExport,
  onImport,
  onClearSelection
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  if (selectedCount === 0) {
    return (
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            选择产品以进行批量操作
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onExport}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </button>
            <button
              onClick={onImport}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Upload className="w-4 h-4 mr-2" />
              批量导入
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-blue-900">
            已选择 {selectedCount} 个产品
          </div>
          <button
            onClick={onClearSelection}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            清除选择
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              更新状态
            </button>
            
            {showStatusMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onBulkStatusUpdate('active')
                      setShowStatusMenu(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    设为启用
                  </button>
                  <button
                    onClick={() => {
                      onBulkStatusUpdate('inactive')
                      setShowStatusMenu(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    设为停用
                  </button>
                  <button
                    onClick={() => {
                      onBulkStatusUpdate('draft')
                      setShowStatusMenu(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    设为草稿
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={onBulkEdit}
            className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Edit className="w-4 h-4 mr-2" />
            批量编辑
          </button>
          
          <button
            onClick={onBulkDelete}
            className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            批量删除
          </button>
        </div>
      </div>
    </div>
  )
}

export default BulkOperationsBar