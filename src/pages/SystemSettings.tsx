import React, { useState, useEffect } from 'react'
import { Upload, Image, Save, Eye, Settings, Activity } from 'lucide-react'
import SystemManagementService from '../lib/system-management-service'
import AuditLogService from '../lib/audit-log-service'
import LoadingSpinner from '../components/LoadingSpinner'
import CompanyLogo from '../components/CompanyLogo'

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'logo' | 'logs'>('logo')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null)
  const [userLogs, setUserLogs] = useState<any[]>([])
  const [productLogs, setProductLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadCurrentLogo()
    if (activeTab === 'logs') {
      loadLogs()
    }
  }, [activeTab])

  const loadCurrentLogo = async () => {
    try {
      const { data } = await SystemManagementService.getCurrentLogo()
      setCurrentLogoUrl(data?.logoUrl)
    } catch (error) {
      console.error('加载当前LOGO失败:', error)
    }
  }

  const loadLogs = async () => {
    try {
      setLogsLoading(true)
      
      const [userLogsResult, productLogsResult] = await Promise.all([
        AuditLogService.getUserAuditLogs(20, 0),
        AuditLogService.getProductAuditLogs(20, 0)
      ])
      
      if (!userLogsResult.error) {
        setUserLogs(userLogsResult.data || [])
      }
      
      if (!productLogsResult.error) {
        setProductLogs(productLogsResult.data || [])
      }
    } catch (error) {
      console.error('加载日志失败:', error)
    } finally {
      setLogsLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: '请选择图片文件' })
        return
      }
      
      // 验证文件大小（5MB）
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: '图片大小不能超过5MB' })
        return
      }
      
      setLogoFile(file)
      
      // 生成预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadLogo = async () => {
    if (!logoFile) {
      setMessage({ type: 'error', text: '请先选择图片文件' })
      return
    }

    try {
      setUploading(true)
      setMessage(null)
      
      const { data, error } = await SystemManagementService.uploadLogo(logoFile)
      
      if (error) {
        throw new Error(error.message)
      }
      
      setCurrentLogoUrl(data.url)
      setLogoFile(null)
      setLogoPreview(null)
      setMessage({ type: 'success', text: 'LOGO上传成功' })
      
      // 刷新页面以显示新LOGO
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error: any) {
      setMessage({ type: 'error', text: '上传失败：' + error.message })
    } finally {
      setUploading(false)
    }
  }

  const clearSelection = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const getActionTypeText = (actionType: string) => {
    const actionMap: Record<string, string> = {
      'CREATE_USER': '创建用户',
      'UPDATE_USER': '更新用户',
      'DELETE_USER': '删除用户',
      'ENABLE_USER': '启用用户',
      'DISABLE_USER': '禁用用户',
      'RESET_PASSWORD': '重置密码',
      'UPLOAD_LOGO': '上传LOGO',
      'UPDATE_SYSTEM_SETTING': '更新系统设置',
      'CREATE': '创建',
      'UPDATE': '更新',
      'DELETE': '删除',
      'BULK_UPDATE': '批量更新',
      'BULK_DELETE': '批量删除',
      'IMPORT': '导入'
    }
    return actionMap[actionType] || actionType
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">系统设置</h2>
        <p className="text-gray-600 mt-1">管理系统外观和配置</p>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* 选项卡 */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('logo')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'logo'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Image className="w-4 h-4" />
                <span>LOGO管理</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>操作日志</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'logo' && (
            <div className="space-y-6">
              {/* 当前LOGO显示 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">当前LOGO</h3>
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <CompanyLogo size="large" />
                  </div>
                  {currentLogoUrl && (
                    <div className="text-sm text-gray-600">
                      <p>当前使用的LOGO</p>
                      <p className="text-xs text-gray-400 mt-1 break-all">{currentLogoUrl}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* LOGO上传 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">上传新LOGO</h3>
                
                {!logoFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            点击上传或拖拽图片到此处
                          </span>
                          <span className="mt-1 block text-sm text-gray-500">
                            支持 PNG, JPG, GIF, SVG 格式，最大5MB
                          </span>
                        </label>
                        <input
                          id="logo-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileSelect}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {logoPreview && (
                          <img
                            src={logoPreview}
                            alt="LOGO预览"
                            className="h-16 w-auto object-contain border rounded"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{logoFile.name}</p>
                        <p className="text-sm text-gray-500">
                          大小: {(logoFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="text-sm text-gray-500">
                          类型: {logoFile.type}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUploadLogo}
                          disabled={uploading}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                          {uploading ? (
                            <LoadingSpinner size="small" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          <span>{uploading ? '上传中...' : '上传'}</span>
                        </button>
                        <button
                          onClick={clearSelection}
                          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6">
              {logsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="large" />
                </div>
              ) : (
                <>
                  {/* 用户操作日志 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">用户管理日志</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">时间</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作员</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作类型</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">目标用户</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">详情</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {userLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {new Date(log.created_at).toLocaleString('zh-CN')}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {log.operator_name || log.operator_email}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  {getActionTypeText(log.action_type)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {log.target_user_email || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {log.operation_details}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {userLogs.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          暂无用户管理日志
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 产品操作日志 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">产品操作日志（最近20条）</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">时间</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">用户</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">影响数量</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">详情</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {productLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {new Date(log.created_at).toLocaleString('zh-CN')}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {log.user_name || log.user_email}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  {getActionTypeText(log.action_type)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {log.affected_records_count}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {log.operation_details}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {productLogs.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          暂无产品操作日志
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SystemSettings