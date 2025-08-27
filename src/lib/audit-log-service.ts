import { supabase } from './supabase'

interface AuditLogData {
  userId: string
  userEmail: string
  userName?: string
  actionType: string
  tableName?: string
  recordId?: number
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  affectedRecordsCount?: number
  operationDetails: string
  ipAddress?: string
}

// 审计日志服务类
export class AuditLogService {
  // 记录操作日志
  static async logOperation(logData: AuditLogData) {
    try {
      const { data, error } = await supabase.functions.invoke('audit-logger', {
        body: logData
      })

      if (error) {
        console.error('记录日志失败:', error)
        return { error }
      }

      return { data, error: null }
    } catch (error: any) {
      console.error('记录日志异常:', error)
      return { error: { code: 'LOG_ERROR', message: error.message } }
    }
  }

  // 获取产品操作日志
  static async getProductAuditLogs(limit = 50, offset = 0) {
    try {
      const { data: logs, error } = await supabase
        .from('product_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      if (error) throw error

      return { data: logs, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'QUERY_ERROR', message: error.message } }
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

  // 辅助方法：自动记录产品操作
  static async logProductOperation({
    userId,
    userEmail,
    userName,
    actionType,
    recordId,
    oldValues,
    newValues,
    operationDetails,
    affectedRecordsCount = 1
  }: {
    userId: string
    userEmail: string
    userName?: string
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE' | 'BULK_DELETE' | 'IMPORT' | 'SUBMIT_CHANGE'
    recordId?: number
    oldValues?: Record<string, any>
    newValues?: Record<string, any>
    operationDetails: string
    affectedRecordsCount?: number
  }) {
    return this.logOperation({
      userId,
      userEmail,
      userName,
      actionType,
      tableName: 'products',
      recordId,
      oldValues,
      newValues,
      affectedRecordsCount,
      operationDetails
    })
  }

  // 获取客户端IP地址（简单实现）
  static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }
}

export default AuditLogService