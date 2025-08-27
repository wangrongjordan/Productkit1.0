// 数据导入模态框组件
import React, { useState, useRef } from 'react'
import { X, Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: any[]) => Promise<{ success: boolean, results?: any, errors?: string[] }>
  loading?: boolean
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  loading = false
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [importData, setImportData] = useState<any[]>([])
  const [importResults, setImportResults] = useState<any>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    const excelFile = files.find(file => 
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls') || 
      file.name.endsWith('.csv')
    )
    
    if (excelFile) {
      parseFile(excelFile)
    } else {
      alert('请上传 Excel (.xlsx, .xls) 或 CSV 文件')
    }
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      parseFile(file)
    }
  }
  
  const parseFile = (file: File) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        let content = e.target?.result as string
        
        if (file.name.endsWith('.csv')) {
          // 简单的CSV解析
          const lines = content.split('\n').filter(line => line.trim())
          const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, ''))
          const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
            const row: Record<string, string> = {}
            headers?.forEach((header, index) => {
              row[header] = values[index] || ''
            })
            return row
          })
          
          setImportData(data.filter(row => Object.values(row).some(v => v)))
        } else {
          // 对于Excel文件，这里只是模拟数据
          // 实际应用中需要使用 xlsx 库来解析
          alert('Excel 文件解析功能尚未实现，请使用 CSV 文件')
          return
        }
        
      } catch (error) {
        console.error('File parsing error:', error)
        alert('文件解析失败，请检查文件格式')
      }
    }
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8')
    } else {
      reader.readAsBinaryString(file)
    }
  }
  
  const handleImport = async () => {
    if (importData.length === 0) {
      alert('没有可导入的数据')
      return
    }
    
    try {
      setImporting(true)
      const results = await onImport(importData)
      setImportResults(results)
      
      if (results.success) {
        setImportData([])
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('导入失败，请稍后重试')
    } finally {
      setImporting(false)
    }
  }
  
  const downloadTemplate = () => {
    // 创建模板 CSV
    const headers = [
      '产品名称*', '产品编码*', '一级分类*', '二级分类*', '三级分类*',
      '产品特性', '尺寸', '款式', '材质', '颜色', '起订量',
      '印刷方式', '后道工艺', '产品配件', '定制区域',
      '产品报价形式', '设计发单', '备注格式', '产品重量',
      '包装方式', '发货时效', '发货地及外协', '产品定位/使用场景',
      '产品卖点', '支持特殊尺寸', '有实物样品', '支持看样', '状态'
    ]
    
    const sampleData = [
      '示例产品名称', 'SAMPLE001', '电子产品', '手机配件', '手机壳',
      '高品质材料，精美设计', '15cm x 8cm', '时尚款', '硅胶+PC', '黑色/白色',
      '100个起订', '丝印', 'UV处理', '包装盒+说明书', '背面下方',
      '阶梯报价', '提供设计稿', '备注：定制LOGO', '约50g',
      '纸盒包装', '5-7个工作日', '深圳发货，非外协', '适用于日常防护',
      '防摔耐用，手感舒适', '是', '是', '是', 'active'
    ]
    
    const csvContent = [headers, sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    // 添加UTF-8 BOM以确保Excel正确显示中文字符
    const BOM = '\uFEFF'
    const csvWithBOM = BOM + csvContent
    
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', '产品导入模板.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  const handleClose = () => {
    setImportData([])
    setImportResults(null)
    onClose()
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            产品数据导入
          </h3>
          <button
            onClick={handleClose}
            disabled={importing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 内容 */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {!importResults ? (
            <div className="space-y-6">
              {/* 下载模板 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">第一步：下载导入模板</h4>
                    <p className="text-sm text-blue-700">
                      下载标准模板，按照格式填写产品数据。带 * 号的字段为必填项。
                    </p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载模板
                  </button>
                </div>
              </div>
              
              {/* 文件上传 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">第二步：上传数据文件</h4>
                
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-700">
                      拖拽文件到这里，或者
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      点击选择文件
                    </button>
                    <p className="text-sm text-gray-500">
                      支持 .xlsx, .xls, .csv 格式，文件大小不超过 10MB
                    </p>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              
              {/* 数据预览 */}
              {importData.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">第三步：数据预览</h4>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">
                        解析到 {importData.length} 条数据记录
                      </p>
                      <button
                        onClick={() => setImportData([])}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        清除数据
                      </button>
                    </div>
                    
                    <div className="max-h-40 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-100">
                          <tr>
                            {Object.keys(importData[0] || {}).slice(0, 6).map(key => (
                              <th key={key} className="px-2 py-1 text-left font-medium text-gray-700">
                                {key}
                              </th>
                            ))}
                            {Object.keys(importData[0] || {}).length > 6 && (
                              <th className="px-2 py-1 text-left font-medium text-gray-700">...</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {importData.slice(0, 5).map((row, index) => (
                            <tr key={index} className="border-t border-gray-200">
                              {Object.values(row).slice(0, 6).map((value: any, i) => (
                                <td key={i} className="px-2 py-1 text-gray-700 truncate max-w-[100px]">
                                  {value}
                                </td>
                              ))}
                              {Object.values(row).length > 6 && (
                                <td className="px-2 py-1 text-gray-500">...</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {importData.length > 5 && (
                        <div className="text-center py-2 text-sm text-gray-500">
                          还有 {importData.length - 5} 条记录...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 导入结果 */
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                importResults.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center mb-2">
                  {importResults.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  )}
                  <h4 className={`font-medium ${
                    importResults.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {importResults.success ? '导入成功' : '导入失败'}
                  </h4>
                </div>
                
                {importResults.results && (
                  <div className={`text-sm ${
                    importResults.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <p>总记录: {importResults.results.totalRows}</p>
                    <p>成功: {importResults.results.successCount}</p>
                    <p>失败: {importResults.results.errorCount}</p>
                  </div>
                )}
              </div>
              
              {importResults.results?.errors && importResults.results.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <h5 className="font-medium text-yellow-900 mb-2">详细错误信息 ({importResults.results.errors.length}条)</h5>
                  <div className="text-sm text-yellow-800 space-y-2 max-h-60 overflow-y-auto">
                    {importResults.results.errors.map((error: any, index: number) => (
                      <div key={index} className="bg-white p-2 rounded border border-yellow-300">
                        <div className="font-medium text-red-700">第 {error.row} 行: {error.message}</div>
                        {error.data && (
                          <div className="text-xs text-gray-600 mt-1">
                            数据: {Object.entries(error.data).slice(0, 3).map(([k, v]: [string, any]) => `${k}: ${v}`).join(', ')}
                            {Object.entries(error.data).length > 3 && '...'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {importResults.errors && importResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="font-medium text-red-900 mb-2">系统错误</h5>
                  <div className="text-sm text-red-800 space-y-1 max-h-40 overflow-y-auto">
                    {importResults.errors.map((error: string, index: number) => (
                      <p key={index}>• {error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 底部操作 */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={importing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {importResults ? '关闭' : '取消'}
          </button>
          
          {!importResults && importData.length > 0 && (
            <button
              onClick={handleImport}
              disabled={importing || importData.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {importing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
              <Upload className="w-4 h-4 mr-2" />
              {importing ? '导入中...' : '开始导入'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImportModal