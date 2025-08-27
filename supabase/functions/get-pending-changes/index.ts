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

    // 检查是否有管理员权限
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: { code: 'FORBIDDEN', message: '没有权限查看审批请求' } }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 解析查询参数
    const url = new URL(req.url)
    const status = url.searchParams.get('status') || 'all'
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const requesterId = url.searchParams.get('requester_id')
    
    let query = supabaseClient
      .from('pending_changes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // 状态筛选
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // 请求人筛选
    if (requesterId) {
      query = query.eq('requester_id', requesterId)
    }

    // 普通管理员只能查看自己的请求
    if (profile.role === 'admin') {
      query = query.eq('requester_id', user.user.id)
    }

    // 分页
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: changes, error: fetchError, count } = await query

    if (fetchError) {
      throw fetchError
    }

    // 获取统计信息
    let stats = null
    if (profile.role === 'superadmin') {
      const [pendingResult, approvedResult, rejectedResult] = await Promise.all([
        supabaseClient.from('pending_changes').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabaseClient.from('pending_changes').select('id', { count: 'exact' }).eq('status', 'approved'),
        supabaseClient.from('pending_changes').select('id', { count: 'exact' }).eq('status', 'rejected')
      ])
      
      stats = {
        pending: pendingResult.count || 0,
        approved: approvedResult.count || 0,
        rejected: rejectedResult.count || 0,
        total: (pendingResult.count || 0) + (approvedResult.count || 0) + (rejectedResult.count || 0)
      }
    }

    return new Response(
      JSON.stringify({ 
        data: {
          changes: changes || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          },
          stats,
          userRole: profile.role
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error fetching pending changes:', error)
    return new Response(
      JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: '获取审批请求列表失败' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})