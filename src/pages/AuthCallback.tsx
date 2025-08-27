import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/LoadingSpinner'

const AuthCallback: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // 获取URL中的哈希片段
        const hashFragment = window.location.hash

        if (hashFragment && hashFragment.length > 0) {
          // 将授权代码交换为会话
          const { data, error } = await supabase.auth.exchangeCodeForSession(hashFragment)

          if (error) {
            console.error('Error exchanging code for session:', error.message)
            navigate('/login?error=' + encodeURIComponent(error.message))
            return
          }

          if (data.session) {
            // 成功登录，重定向到主页
            navigate('/', { replace: true })
            return
          }
        }

        // 如果没有找到会话，返回登录页
        navigate('/login?error=' + encodeURIComponent('未找到登录会话'))
      } catch (error) {
        console.error('Callback error:', error)
        navigate('/login?error=' + encodeURIComponent('登录回调处理失败'))
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-gray-600">正在处理登录...</p>
      </div>
    </div>
  )
}

export default AuthCallback
