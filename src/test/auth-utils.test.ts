import { describe, it, expect } from 'vitest'

// 认证相关工具函数
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('密码长度至少8位')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母')
  }
  
  if (!/\\d/.test(password)) {
    errors.push('密码必须包含至少一个数字')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const getUserRoleLevel = (role: string): number => {
  const roleLevels = {
    'user': 1,
    'admin': 2,
    'superadmin': 3
  }
  
  return roleLevels[role as keyof typeof roleLevels] || 0
}

export const hasPermission = (userRole: string, requiredRole: string): boolean => {
  return getUserRoleLevel(userRole) >= getUserRoleLevel(requiredRole)
}

describe('Authentication Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('test+tag@example.org')).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test.example.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('StrongPass123')
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should reject weak passwords', () => {
      const shortPassword = validatePassword('Weak1')
      expect(shortPassword.isValid).toBe(false)
      expect(shortPassword.errors).toContain('密码长度至少8位')

      const noUpperCase = validatePassword('weakpass123')
      expect(noUpperCase.isValid).toBe(false)
      expect(noUpperCase.errors).toContain('密码必须包含至少一个大写字母')

      const noLowerCase = validatePassword('WEAKPASS123')
      expect(noLowerCase.isValid).toBe(false)
      expect(noLowerCase.errors).toContain('密码必须包含至少一个小写字母')

      const noNumber = validatePassword('WeakPassword')
      expect(noNumber.isValid).toBe(false)
      expect(noNumber.errors).toContain('密码必须包含至少一个数字')
    })
  })

  describe('getUserRoleLevel', () => {
    it('should return correct role levels', () => {
      expect(getUserRoleLevel('user')).toBe(1)
      expect(getUserRoleLevel('admin')).toBe(2)
      expect(getUserRoleLevel('superadmin')).toBe(3)
      expect(getUserRoleLevel('unknown')).toBe(0)
    })
  })

  describe('hasPermission', () => {
    it('should correctly check user permissions', () => {
      // 超级管理员可以访问所有级别
      expect(hasPermission('superadmin', 'user')).toBe(true)
      expect(hasPermission('superadmin', 'admin')).toBe(true)
      expect(hasPermission('superadmin', 'superadmin')).toBe(true)

      // 管理员可以访问用户级别
      expect(hasPermission('admin', 'user')).toBe(true)
      expect(hasPermission('admin', 'admin')).toBe(true)
      expect(hasPermission('admin', 'superadmin')).toBe(false)

      // 普通用户只能访问用户级别
      expect(hasPermission('user', 'user')).toBe(true)
      expect(hasPermission('user', 'admin')).toBe(false)
      expect(hasPermission('user', 'superadmin')).toBe(false)
    })
  })
})"