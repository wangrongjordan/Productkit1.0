import { supabase } from './supabase'

interface SystemSettingsResponse {
  data?: any
  error?: { code: string; message: string }
}

// 系统管理服务类
export class SystemManagementService {
  private static async callSystemManagementFunction(action: string, data: any): Promise<SystemSettingsResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('用户未登录')
      }

      const { data: result, error } = await supabase.functions.invoke('system-management', {
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

  // 上传企业LOGO
  static async uploadLogo(file: File): Promise<SystemSettingsResponse> {
    try {
      // 将文件转换为base64
      const fileData = await this.fileToBase64(file)
      
      return this.callSystemManagementFunction('upload_logo', {
        fileName: `logo_${Date.now()}.${file.name.split('.').pop()}`,
        fileData: fileData.split(',')[1], // 移除data:image/...;base64,前缀
        fileType: file.type
      })
    } catch (error: any) {
      return { error: { code: 'UPLOAD_ERROR', message: error.message } }
    }
  }

  // 获取企业LOGO URL
  static async getLogo(): Promise<SystemSettingsResponse> {
    return this.callSystemManagementFunction('get_logo', {})
  }

  // 获取所有系统设置
  static async getSystemSettings(): Promise<SystemSettingsResponse> {
    return this.callSystemManagementFunction('get_system_settings', {})
  }

  // 更新系统设置
  static async updateSetting(key: string, value: string, type = 'text', description = ''): Promise<SystemSettingsResponse> {
    return this.callSystemManagementFunction('update_setting', {
      key,
      value,
      type,
      description
    })
  }

  // 获取当前LOGO（公共方法，无需认证）
  static async getCurrentLogo() {
    try {
      const { data: setting, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'company_logo_url')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return { data: { logoUrl: setting?.setting_value || null }, error: null }
    } catch (error: any) {
      return { data: { logoUrl: null }, error: { code: 'QUERY_ERROR', message: error.message } }
    }
  }

  // 辅助方法：文件转base64
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }
}

export default SystemManagementService