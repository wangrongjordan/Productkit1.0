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
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4');
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        
        const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        const requestData = await req.json();
        const { 
            userId, 
            userEmail, 
            userName, 
            actionType, 
            tableName = 'products', 
            recordId, 
            oldValues, 
            newValues, 
            affectedRecordsCount = 1, 
            operationDetails,
            ipAddress
        } = requestData;

        // 记录操作日志
        const { error: logError } = await adminSupabase
            .from('product_audit_logs')
            .insert({
                user_id: userId,
                user_email: userEmail,
                user_name: userName,
                action_type: actionType,
                table_name: tableName,
                record_id: recordId,
                old_values: oldValues,
                new_values: newValues,
                affected_records_count: affectedRecordsCount,
                operation_details: operationDetails,
                ip_address: ipAddress
            });

        if (logError) {
            throw logError;
        }

        return new Response(JSON.stringify({ 
            data: { message: '日志记录成功' } 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Audit log error:', error);
        
        const errorResponse = {
            error: {
                code: 'AUDIT_LOG_ERROR',
                message: error.message || '日志记录失败'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});