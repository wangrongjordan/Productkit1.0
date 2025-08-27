import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: user } = await supabaseClient.auth.getUser(token)
    
    if (!user.user) {
      return new Response(
        JSON.stringify({ error: { code: 'UNAUTHORIZED', message: '用户未认证' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 获取用户配置信息
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: { code: 'PROFILE_NOT_FOUND', message: '用户配置未找到' } }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, resource } = await req.json()

    let hasPermission = false

    // 权限检查逻辑
    switch (action) {
      case 'read':
        // 所有登录用户都可以查看
        hasPermission = true
        break
      case 'create':
      case 'update':
      case 'delete':
        // 管理员和超级管理员可以提交变更请求
        hasPermission = ['admin', 'superadmin'].includes(profile.role)
        break
      case 'approve':
        // 只有超级管理员可以审批
        hasPermission = profile.role === 'superadmin'
        break
      case 'admin_access':
        // 管理员面板访问权限
        hasPermission = ['admin', 'superadmin'].includes(profile.role)
        break
      default:
        hasPermission = false
    }

    return new Response(
      JSON.stringify({ 
        data: { 
          hasPermission,
          userRole: profile.role,
          userId: user.user.id
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error checking permissions:', error)
    return new Response(
      JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: '权限检查失败' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})