import React, { useState, useEffect } from 'react'
import SystemManagementService from '../lib/system-management-service'

interface CompanyLogoProps {
  className?: string
  size?: 'small' | 'medium' | 'large'
  showFallback?: boolean
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({ 
  className = '', 
  size = 'medium',
  showFallback = true 
}) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const sizeClasses = {
    small: 'h-8 w-auto',
    medium: 'h-12 w-auto',
    large: 'h-16 w-auto'
  }

  useEffect(() => {
    loadLogo()
  }, [])

  const loadLogo = async () => {
    try {
      setLoading(true)
      const { data, error } = await SystemManagementService.getCurrentLogo()
      
      if (error) {
        console.error('加载LOGO失败:', error)
        setError(true)
      } else {
        setLogoUrl(data?.logoUrl)
      }
    } catch (error) {
      console.error('加载LOGO异常:', error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-200 animate-pulse rounded`} />
    )
  }

  if (logoUrl && !error) {
    return (
      <img
        src={logoUrl}
        alt="公司LOGO"
        className={`${sizeClasses[size]} ${className} object-contain`}
        onError={() => setError(true)}
      />
    )
  }

  if (showFallback) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-blue-600 rounded-lg flex items-center justify-center`}>
        <span className="text-white font-bold text-sm">
          {size === 'small' ? '公司' : '企业知识库'}
        </span>
      </div>
    )
  }

  return null
}

export default CompanyLogo