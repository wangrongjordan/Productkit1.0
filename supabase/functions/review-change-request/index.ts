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

    // 检查是否为超级管理员
    if (profile.role !== 'superadmin') {
      return new Response(
        JSON.stringify({ error: { code: 'FORBIDDEN', message: '只有超级管理员可以审批变更请求' } }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { changeRequestId, decision, reviewNotes } = await req.json()

    if (!['approved', 'rejected'].includes(decision)) {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_DECISION', message: '无效的审批决定' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 获取变更请求
    const { data: changeRequest, error: fetchError } = await supabaseClient
      .from('pending_changes')
      .select('*')
      .eq('id', changeRequestId)
      .eq('status', 'pending')
      .single()

    if (fetchError || !changeRequest) {
      return new Response(
        JSON.stringify({ error: { code: 'REQUEST_NOT_FOUND', message: '变更请求未找到或已被处理' } }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 更新审批状态
    const { error: updateError } = await supabaseClient
      .from('pending_changes')
      .update({
        status: decision,
        reviewer_id: user.user.id,
        reviewer_email: user.user.email,
        reviewer_name: profile.full_name,
        review_notes: reviewNotes,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', changeRequestId)

    if (updateError) {
      throw updateError
    }

    let executionResult = null

    // 如果审批通过，执行实际操作
    if (decision === 'approved') {
      try {
        switch (changeRequest.change_type) {
          case 'CREATE':
            const { data: createData, error: createError } = await supabaseClient
              .from(changeRequest.table_name)
              .insert([changeRequest.new_values])
              .select()
              .single()
            
            if (createError) throw createError
            executionResult = createData
            break
            
          case 'UPDATE':
            const { data: updateData, error: updateDataError } = await supabaseClient
              .from(changeRequest.table_name)
              .update(changeRequest.new_values)
              .eq('id', changeRequest.record_id)
              .select()
              .single()
            
            if (updateDataError) throw updateDataError
            executionResult = updateData
            break
            
          case 'DELETE':
            const { error: deleteError } = await supabaseClient
              .from(changeRequest.table_name)
              .delete()
              .eq('id', changeRequest.record_id)
            
            if (deleteError) throw deleteError
            executionResult = { deleted: true }
            break
        }
        
        // 记录审计日志
        await supabaseClient
          .from('product_audit_logs')
          .insert([{
            user_id: changeRequest.requester_id,
            user_email: changeRequest.requester_email,
            user_name: changeRequest.requester_name,
            action_type: changeRequest.change_type,
            table_name: changeRequest.table_name,
            record_id: changeRequest.record_id,
            old_values: changeRequest.old_values,
            new_values: changeRequest.new_values,
            affected_records_count: 1,
            operation_details: `${changeRequest.change_description} - 由超级管理员${profile.full_name}审批通过`
          }])
          
      } catch (executionError) {
        console.error('Error executing approved change:', executionError)
        
        // 如果执行失败，更新状态为失败
        await supabaseClient
          .from('pending_changes')
          .update({
            status: 'rejected',
            review_notes: `执行失败: ${executionError.message}. 原审批意见: ${reviewNotes || ''}`
          })
          .eq('id', changeRequestId)
        
        return new Response(
          JSON.stringify({ error: { code: 'EXECUTION_FAILED', message: '审批通过但执行失败' } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ 
        data: { 
          decision,
          executed: decision === 'approved',
          executionResult,
          message: decision === 'approved' ? '变更请求已审批通过并执行' : '变更请求已拒绝'
        } 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error reviewing change request:', error)
    return new Response(
      JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: '审批变更请求失败' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})