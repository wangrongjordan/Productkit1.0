// 操作日志组件
import React, { useState, useEffect } from 'react'
import { Clock, User, Edit, Trash2, Plus, RefreshCw } from 'lucide-react'
import { getAuditLogs } from '../lib/product-service'
import Pagination from './Pagination'

// 本地定义ProductAuditLog接口
interface ProductAuditLog {
  id: number
  user_id: string | null
  user_email: string
  user_name: string | null
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE' | 'BULK_DELETE' | 'IMPORT' | 'SUBMIT_CHANGE'
  table_name: string
  record_id: number | null
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  affected_records_count: number
  operation_details: string | null
  ip_address: string | null
  created_at: string
}

interface AuditLogViewerProps {
  className?: string
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ className = '' }) => {
  const [logs, setLogs] = useState<ProductAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalLogs, setTotalLogs] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  
  useEffect(() => {
    loadLogs()
  }, [currentPage, pageSize])
  
  const loadLogs = async () => {
    try {
      setLoading(true)
      const result = await getAuditLogs(currentPage, pageSize)
      setLogs(result.logs)
      setTotalLogs(result.total)
      setTotalPages(result.totalPages)
    } catch (error) {
      console.error('Error loading audit logs:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Plus className="w-4 h-4 text-green-600" />
      case 'UPDATE': return <Edit className="w-4 h-4 text-blue-600" />
      case 'DELETE': return <Trash2 className="w-4 h-4 text-red-600" />
      case 'BULK_UPDATE': return <RefreshCw className="w-4 h-4 text-orange-600" />
      case 'BULK_DELETE': return <Trash2 className="w-4 h-4 text-red-600" />
      case 'IMPORT': return <Plus className="w-4 h-4 text-purple-600" />
      default: return <Edit className="w-4 h-4 text-gray-600" />
    }
  }
  
  const getActionText = (action: string) => {
    switch (action) {
      case 'CREATE': return '创建'
      case 'UPDATE': return '更新'
      case 'DELETE': return '删除'
      case 'BULK_UPDATE': return '批量更新'
      case 'BULK_DELETE': return '批量删除'
      case 'IMPORT': return '批量导入'
      default: return action
    }
  }
  
  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800'
      case 'UPDATE': return 'bg-blue-100 text-blue-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      case 'BULK_UPDATE': return 'bg-orange-100 text-orange-800'
      case 'BULK_DELETE': return 'bg-red-100 text-red-800'
      case 'IMPORT': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
  
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载操作日志...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* 头部 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">操作日志</h3>
            <p className="text-sm text-gray-600 mt-1">查看所有产品操作的详细记录</p>
          </div>
          <button
            onClick={loadLogs}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="刷新日志"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* 日志列表 */}
      <div className="overflow-x-auto">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            暂无操作日志记录
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作人员
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作详情
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  影响数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作时间
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getActionIcon(log.action_type)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getActionColor(log.action_type)
                      }`}>
                        {getActionText(log.action_type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.user_name || log.user_email}
                        </div>
                        {log.user_name && (
                          <div className="text-sm text-gray-500">{log.user_email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-md">
                      {log.operation_details || '无详细信息'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {log.affected_records_count} 条记录
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(log.created_at)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* 分页 */}
      {totalLogs > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalLogs}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setCurrentPage(1)
          }}
        />
      )}
    </div>
  )
}

export default AuditLogViewer