import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Clock, CheckCircle, XCircle, Eye, User, Calendar } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

interface PendingChange {
  id: string
  product_id: string
  user_id: string
  changes: any
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_by?: string
  reviewed_at?: string
  notes?: string
  user_profile?: {
    full_name: string
    email: string
  }
  product?: {
    product_name: string
    product_code: string
  }
}

const ApprovalManagement: React.FC = () => {
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedChange, setSelectedChange] = useState<PendingChange | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.role === 'superadmin') {
      loadPendingChanges()
    }
  }, [profile])

  async function loadPendingChanges() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pending_changes')
        .select(`
          *,
          user_profile:profiles!pending_changes_user_id_fkey(
            full_name,
            email
          ),
          product:products!pending_changes_product_id_fkey(
            product_name,
            product_code
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPendingChanges(data || [])
    } catch (error) {
      console.error('Error loading pending changes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(changeId: string) {
    if (processing) return
    
    try {
      setProcessing(changeId)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('未登录')
      }
      
      const response = await fetch(`https://syaypwklvsfupwlcgxqz.supabase.co/functions/v1/approve-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          change_id: changeId,
          notes: reviewNotes
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`审批失败: ${errorText}`)
      }

      await loadPendingChanges()
      setSelectedChange(null)
      setReviewNotes('')
    } catch (error) {
      console.error('Error approving change:', error)
      alert(`审批失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setProcessing(null)
    }
  }

  async function handleReject(changeId: string) {
    if (processing) return
    
    try {
      setProcessing(changeId)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('未登录')
      }
      
      const response = await fetch(`https://syaypwklvsfupwlcgxqz.supabase.co/functions/v1/reject-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          change_id: changeId,
          notes: reviewNotes
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`拒绝失败: ${errorText}`)
      }

      await loadPendingChanges()
      setSelectedChange(null)
      setReviewNotes('')
    } catch (error) {
      console.error('Error rejecting change:', error)
      alert(`拒绝失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setProcessing(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '等待审批'
      case 'approved': return '已批准'
      case 'rejected': return '已拒绝'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  const pendingCount = pendingChanges.filter(change => change.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">审批管理</h1>
          <p className="text-gray-600 mt-1">
            管理员修改请求的审批和管理
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900 font-medium">
              {pendingCount} 个待处理请求
            </span>
          </div>
        </div>
      </div>

      {/* Pending Changes List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">修改请求列表</h2>
        </div>
        
        {pendingChanges.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <p className="text-gray-500 text-lg">暂无修改请求</p>
            <p className="text-gray-400 text-sm mt-2">管理员提交的修改会在此处显示</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingChanges.map((change) => (
              <div key={change.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(change.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                        getStatusColor(change.status)
                      }`}>
                        {getStatusText(change.status)}
                      </span>
                      <span className="text-sm text-gray-500">
                        #{change.id.slice(0, 8)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {change.product?.product_name || '产品修改'}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      产品代码：{change.product?.product_code}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{change.user_profile?.full_name || change.user_profile?.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(change.created_at).toLocaleString('zh-CN')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedChange(change)}
                      className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>查看详情</span>
                    </button>
                    
                    {change.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(change.id)}
                          disabled={processing === change.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {processing === change.id ? <LoadingSpinner size="small" /> : '批准'}
                        </button>
                        <button
                          onClick={() => handleReject(change.id)}
                          disabled={processing === change.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {processing === change.id ? <LoadingSpinner size="small" /> : '拒绝'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Detail Modal */}
      {selectedChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">修改详情</h2>
                <button
                  onClick={() => setSelectedChange(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-medium mb-3">基本信息</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-500">产品名称</label>
                    <p className="font-medium">{selectedChange.product?.product_name}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">产品代码</label>
                    <p className="font-medium">{selectedChange.product?.product_code}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">申请人</label>
                    <p className="font-medium">{selectedChange.user_profile?.full_name}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">申请时间</label>
                    <p className="font-medium">
                      {new Date(selectedChange.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Changes */}
              <div>
                <h3 className="text-lg font-medium mb-3">修改内容</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedChange.changes, null, 2)}
                  </pre>
                </div>
              </div>
              
              {/* Review Notes */}
              {selectedChange.status === 'pending' && (
                <div>
                  <h3 className="text-lg font-medium mb-3">审批备注</h3>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="请输入审批意见..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
              )}
              
              {/* Review History */}
              {selectedChange.notes && (
                <div>
                  <h3 className="text-lg font-medium mb-3">审批记录</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedChange.notes}</p>
                    {selectedChange.reviewed_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        审批时间：{new Date(selectedChange.reviewed_at).toLocaleString('zh-CN')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            {selectedChange.status === 'pending' && (
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedChange(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleReject(selectedChange.id)}
                  disabled={processing === selectedChange.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {processing === selectedChange.id ? <LoadingSpinner size="small" /> : '拒绝'}
                </button>
                <button
                  onClick={() => handleApprove(selectedChange.id)}
                  disabled={processing === selectedChange.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {processing === selectedChange.id ? <LoadingSpinner size="small" /> : '批准'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ApprovalManagement
