import React, { useState, useEffect } from 'react'
import { User, Edit, Ban, CheckCircle, Plus, Shield, Search, Key, Trash2, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'
import UserManagementService from '../lib/user-management-service'
import LoadingSpinner from '../components/LoadingSpinner'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'user' | 'admin' | 'superadmin'
  created_at: string
  updated_at: string
  email_confirmed_at: string | null
  is_active?: boolean
}

interface UserManagementProps {
  className?: string
}

const UserManagement: React.FC<UserManagementProps> = ({ className = '' }) => {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // 模态状态
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  
  // 表单数据
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user' as 'user' | 'admin' | 'superadmin'
  })
  
  const [editForm, setEditForm] = useState({
    full_name: '',
    role: 'user' as 'user' | 'admin' | 'superadmin'
  })
  
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [users, searchQuery, roleFilter, statusFilter])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      const { data: profiles, error } = await UserManagementService.getUsers()
      
      if (error) {
        throw new Error(error.message)
      }
      
      // 获取auth用户状态信息
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email_confirmed_at, banned_until')
      
      // 合并数据
      const usersWithStatus = profiles.map(profile => {
        const authUser = authUsers?.find(user => user.id === profile.id)
        return {
          ...profile,
          email_confirmed_at: authUser?.email_confirmed_at || null,
          is_active: !authUser?.banned_until // 如果被禁用，则不活跃
        }
      })

      setUsers(usersWithStatus)
    } catch (error: any) {
      console.error('Error loading users:', error)
      showMessage('error', '加载用户数据失败：' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = users

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(query) ||
        (user.full_name && user.full_name.toLowerCase().includes(query))
      )
    }

    // 角色过滤
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // 状态过滤
    if (statusFilter) {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => user.is_active)
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(user => !user.is_active)
      }
    }

    setFilteredUsers(filtered)
  }

  const handleCreateUser = async () => {
    try {
      if (createForm.password !== passwordForm.confirmPassword && passwordForm.confirmPassword) {
        showMessage('error', '两次输入的密码不一致')
        return
      }
      
      setProcessing(true)
      
      const { data, error } = await UserManagementService.createUser(createForm)
      
      if (error) {
        throw new Error(error.message)
      }
      
      showMessage('success', '用户创建成功')
      setShowCreateModal(false)
      setCreateForm({ email: '', password: '', full_name: '', role: 'user' })
      setPasswordForm({ newPassword: '', confirmPassword: '' })
      loadUsers()
    } catch (error: any) {
      showMessage('error', '创建用户失败：' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user)
    setEditForm({
      full_name: user.full_name || '',
      role: user.role
    })
    setShowEditModal(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    
    try {
      setProcessing(true)
      
      const { error } = await UserManagementService.updateUserProfile(editingUser.id, editForm)
      
      if (error) {
        throw new Error(error.message)
      }
      
      showMessage('success', '用户信息更新成功')
      setShowEditModal(false)
      setEditingUser(null)
      loadUsers()
    } catch (error: any) {
      showMessage('error', '更新用户失败：' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleResetPassword = (user: UserProfile) => {
    setEditingUser(user)
    setPasswordForm({ newPassword: '', confirmPassword: '' })
    setShowPasswordModal(true)
  }

  const handleUpdatePassword = async () => {
    if (!editingUser) return
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', '两次输入的密码不一致')
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      showMessage('error', '密码长度不能少于6位')
      return
    }
    
    try {
      setProcessing(true)
      
      const { error } = await UserManagementService.updateUserPassword(editingUser.id, passwordForm.newPassword)
      
      if (error) {
        throw new Error(error.message)
      }
      
      showMessage('success', '密码重置成功')
      setShowPasswordModal(false)
      setEditingUser(null)
      setPasswordForm({ newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      showMessage('error', '密码重置失败：' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleToggleUserStatus = async (user: UserProfile, newStatus: boolean) => {
    if (!confirm(`确定要${newStatus ? '启用' : '禁用'}用户 "${user.email}" 吗？`)) {
      return
    }

    try {
      setProcessing(true)
      
      const { error } = await UserManagementService.updateUserStatus(user.id, newStatus)
      
      if (error) {
        throw new Error(error.message)
      }

      showMessage('success', `用户已${newStatus ? '启用' : '禁用'}`)
      loadUsers()
    } catch (error: any) {
      showMessage('error', `${newStatus ? '启用' : '禁用'}用户失败：` + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteUser = async (user: UserProfile) => {
    if (!confirm(`确定要删除用户 "${user.email}" 吗？此操作不可恢复。`)) {
      return
    }

    try {
      setProcessing(true)
      
      const { error } = await UserManagementService.deleteUser(user.id)
      
      if (error) {
        throw new Error(error.message)
      }

      showMessage('success', '用户删除成功')
      loadUsers()
    } catch (error: any) {
      showMessage('error', '删除用户失败：' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const getRoleText = (role: string) => {
    const roleMap: Record<string, string> = {
      'user': '普通员工',
      'admin': '管理员',
      'superadmin': '超级管理员'
    }
    return roleMap[role] || role
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Shield className="w-4 h-4 text-red-600" />
      case 'admin': return <Shield className="w-4 h-4 text-blue-600" />
      default: return <User className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800 border-red-200'
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
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

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">用户管理</h2>
          <p className="text-gray-600 mt-1">管理系统用户账户、权限和状态</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>创建用户</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索用户邮箱或姓名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">所有角色</option>
              <option value="user">普通员工</option>
              <option value="admin">管理员</option>
              <option value="superadmin">超级管理员</option>
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">所有状态</option>
              <option value="active">已启用</option>
              <option value="inactive">已禁用</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">👤</div>
            <p className="text-gray-500 text-lg">暂无用户数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">用户信息</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">角色</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">注册时间</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        {getRoleIcon(user.role)}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || '未设置'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${
                        getRoleBadgeColor(user.role)
                      }`}>
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${
                        getStatusBadgeColor(user.is_active !== false)
                      }`}>
                        {user.is_active !== false ? '已启用' : '已禁用'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('zh-CN')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(user.created_at).toLocaleTimeString('zh-CN')}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="编辑用户"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="重置密码"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        
                        {user.is_active !== false ? (
                          <button
                            onClick={() => handleToggleUserStatus(user, false)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="禁用用户"
                            disabled={processing}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleUserStatus(user, true)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="启用用户"
                            disabled={processing}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除用户"
                          disabled={processing}
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
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full m-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">创建新用户</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    邮箱地址 *
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入邮箱地址"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    密码 *
                  </label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入密码（不少于6位）"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓名
                  </label>
                  <input
                    type="text"
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({...createForm, full_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入用户姓名"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    用户角色
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({...createForm, role: e.target.value as 'user' | 'admin' | 'superadmin'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="user">普通员工</option>
                    <option value="admin">管理员</option>
                    <option value="superadmin">超级管理员</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={processing || !createForm.email || !createForm.password}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {processing ? <LoadingSpinner size="small" /> : '创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full m-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">编辑用户信息</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    姓名
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入用户姓名"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    用户角色
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value as 'user' | 'admin' | 'superadmin'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="user">普通员工</option>
                    <option value="admin">管理员</option>
                    <option value="superadmin">超级管理员</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateUser}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {processing ? <LoadingSpinner size="small" /> : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full m-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">重置用户密码</h3>
              
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  用户：{editingUser.email}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    新密码 *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入新密码（不少于6位）"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    确认密码 *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请再次输入密码"
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdatePassword}
                  disabled={processing || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {processing ? <LoadingSpinner size="small" /> : '重置密码'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement