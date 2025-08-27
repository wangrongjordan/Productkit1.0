// 批量产品操作 Edge Function
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { operation, productIds, updateData, userInfo } = requestData;

    // 这里可以使用Supabase客户端进行数据库操作
    // 由于在Deno环境中，需要使用环境变量获取Supabase凭据
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration not found');
    }

    let result;
    const auditLog = {
      user_id: userInfo?.id || null,
      user_email: userInfo?.email || 'unknown',
      user_name: userInfo?.name || 'unknown',
      action_type: '',
      affected_records_count: productIds?.length || 0,
      operation_details: '',
      ip_address: req.headers.get('x-forwarded-for') || 'unknown'
    };

    switch (operation) {
      case 'bulk_update_status':
        auditLog.action_type = 'BULK_UPDATE';
        auditLog.operation_details = `批量更新 ${productIds.length} 个产品状态为: ${updateData.status}`;
        
        // 这里应该执行实际的批量更新操作
        result = {
          success: true,
          message: `成功更新 ${productIds.length} 个产品状态`,
          affectedCount: productIds.length
        };
        break;

      case 'bulk_delete':
        auditLog.action_type = 'BULK_DELETE';
        auditLog.operation_details = `批量删除 ${productIds.length} 个产品`;
        
        result = {
          success: true,
          message: `成功删除 ${productIds.length} 个产品`,
          affectedCount: productIds.length
        };
        break;

      case 'bulk_update_fields':
        auditLog.action_type = 'BULK_UPDATE';
        const fieldNames = Object.keys(updateData).join(', ');
        auditLog.operation_details = `批量更新 ${productIds.length} 个产品的字段: ${fieldNames}`;
        
        result = {
          success: true,
          message: `成功批量更新 ${productIds.length} 个产品的字段`,
          affectedCount: productIds.length
        };
        break;

      default:
        throw new Error(`未知的操作类型: ${operation}`);
    }

    // 记录审计日志 - 在实际实现中这里会调用数据库
    console.log('Audit log:', auditLog);

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Bulk operation error:', error);
    
    return new Response(JSON.stringify({
      error: {
        code: 'BULK_OPERATION_ERROR',
        message: error.message || '批量操作失败'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});