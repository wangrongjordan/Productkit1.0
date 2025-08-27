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
      .select('*')
      .eq('id', user.user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: { code: 'PROFILE_NOT_FOUND', message: '用户配置未找到' } }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 检查权限
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: { code: 'FORBIDDEN', message: '权限不足' } }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestData = await req.json()
    const { 
      changeType, 
      tableName = 'products', 
      recordId, 
      oldValues, 
      newValues, 
      changeDescription 
    } = requestData

    // 如果是超级管理员，直接执行操作而不需要审批
    if (profile.role === 'superadmin') {
      let result
      
      switch (changeType) {
        case 'CREATE':
          const { data: createData, error: createError } = await supabaseClient
            .from(tableName)
            .insert([newValues])
            .select()
            .single()
          
          if (createError) throw createError
          result = createData
          break
          
        case 'UPDATE':
          const { data: updateData, error: updateError } = await supabaseClient
            .from(tableName)
            .update(newValues)
            .eq('id', recordId)
            .select()
            .single()
          
          if (updateError) throw updateError
          result = updateData
          break
          
        case 'DELETE':
          const { error: deleteError } = await supabaseClient
            .from(tableName)
            .delete()
            .eq('id', recordId)
          
          if (deleteError) throw deleteError
          result = { deleted: true }
          break
      }
      
      // 记录审计日志
      await supabaseClient
        .from('product_audit_logs')
        .insert([{
          user_id: user.user.id,
          user_email: user.user.email,
          user_name: profile.full_name,
          action_type: changeType,
          table_name: tableName,
          record_id: recordId,
          old_values: oldValues,
          new_values: newValues,
          affected_records_count: 1,
          operation_details: changeDescription || `${changeType} operation by superadmin`
        }])
      
      return new Response(
        JSON.stringify({ 
          data: { 
            executed: true, 
            result,
            message: '操作已直接执行' 
          } 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 普通管理员需要提交审批请求
    const { data: pendingChange, error: pendingError } = await supabaseClient
      .from('pending_changes')
      .insert([{
        requester_id: user.user.id,
        requester_email: user.user.email,
        requester_name: profile.full_name,
        change_type: changeType,
        table_name: tableName,
        record_id: recordId,
        old_values: oldValues,
        new_values: newValues,
        change_description: changeDescription
      }])
      .select()
      .single()

    if (pendingError) {
      throw pendingError
    }

    return new Response(
      JSON.stringify({ 
        data: { 
          submitted: true, 
          changeRequestId: pendingChange.id,
          message: '变更请求已提交，等待超级管理员审批' 
        } 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error submitting change request:', error)
    return new Response(
      JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: '提交变更请求失败' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})