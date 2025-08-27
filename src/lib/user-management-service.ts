import { supabase } from './supabase'
import { useAuth } from '../contexts/AuthContext'

interface CreateUserData {
  email: string
  password: string
  full_name: string
  role?: 'user' | 'admin' | 'superadmin'
}

interface UserManagementResponse {
  data?: any
  error?: { code: string; message: string }
}

// 用户管理服务类
export class UserManagementService {
  private static async callUserManagementFunction(action: string, data: any): Promise<UserManagementResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('用户未登录')
      }

      const { data: result, error } = await supabase.functions.invoke('user-management', {
        body: {
          action,
          data,
          operatorId: user.id
        }
      })

      if (error) {
        return { error: { code: 'FUNCTION_ERROR', message: error.message } }
      }

      return result
    } catch (error: any) {
      return { error: { code: 'SERVICE_ERROR', message: error.message } }
    }
  }

  // 创建新用户
  static async createUser(userData: CreateUserData): Promise<UserManagementResponse> {
    return this.callUserManagementFunction('create_user', userData)
  }

  // 更新用户密码
  static async updateUserPassword(userId: string, newPassword: string): Promise<UserManagementResponse> {
    return this.callUserManagementFunction('update_user_password', { userId, newPassword })
  }

  // 删除用户
  static async deleteUser(userId: string): Promise<UserManagementResponse> {
    return this.callUserManagementFunction('delete_user', { userId })
  }

  // 更新用户状态
  static async updateUserStatus(userId: string, isActive: boolean): Promise<UserManagementResponse> {
    return this.callUserManagementFunction('update_user_status', { userId, isActive })
  }

  // 获取用户列表（使用现有的profiles查询）
  static async getUsers() {
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (profileError) throw profileError

      return { data: profiles, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'QUERY_ERROR', message: error.message } }
    }
  }

  // 更新用户信息（角色等）
  static async updateUserProfile(userId: string, updateData: { full_name?: string; role?: string }) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error
      
      return { error: null }
    } catch (error: any) {
      return { error: { code: 'UPDATE_ERROR', message: error.message } }
    }
  }

  // 获取用户操作日志
  static async getUserAuditLogs(limit = 50, offset = 0) {
    try {
      const { data: logs, error } = await supabase
        .from('user_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      if (error) throw error

      return { data: logs, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'QUERY_ERROR', message: error.message } }
    }
  }
}

export default UserManagementService