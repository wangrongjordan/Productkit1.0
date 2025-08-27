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
        
        const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const requestData = await req.json();
        const { action, data, operatorId } = requestData;

        // 验证操作员是否为超级管理员
        const { data: operatorProfile, error: operatorError } = await adminSupabase
            .from('profiles')
            .select('role, email, full_name')
            .eq('id', operatorId)
            .single();

        if (operatorError || operatorProfile.role !== 'superadmin') {
            return new Response(JSON.stringify({ 
                error: { code: 'UNAUTHORIZED', message: '只有超级管理员可以执行此操作' } 
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        let result;

        switch (action) {
            case 'create_user': {
                const { email, password, full_name, role = 'user' } = data;
                
                // 创建用户
                const { data: authUser, error: createError } = await adminSupabase.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: { full_name }
                });

                if (createError) {
                    throw createError;
                }

                // 更新用户角色
                const { error: profileError } = await adminSupabase
                    .from('profiles')
                    .update({ role, full_name })
                    .eq('id', authUser.user.id);

                if (profileError) {
                    // 如果更新角色失败，删除已创建的用户
                    await adminSupabase.auth.admin.deleteUser(authUser.user.id);
                    throw profileError;
                }

                // 记录日志
                await adminSupabase
                    .from('user_audit_logs')
                    .insert({
                        operator_id: operatorId,
                        operator_email: operatorProfile.email,
                        operator_name: operatorProfile.full_name,
                        action_type: 'CREATE_USER',
                        target_user_email: email,
                        operation_details: `创建用户: ${email}, 角色: ${role}`
                    });

                result = { user: authUser.user, message: '用户创建成功' };
                break;
            }

            case 'update_user_password': {
                const { userId, newPassword } = data;
                
                const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
                    userId,
                    { password: newPassword }
                );

                if (updateError) {
                    throw updateError;
                }

                // 获取目标用户信息用于日志
                const { data: targetUser } = await adminSupabase
                    .from('profiles')
                    .select('email')
                    .eq('id', userId)
                    .single();

                // 记录日志
                await adminSupabase
                    .from('user_audit_logs')
                    .insert({
                        user_id: userId,
                        operator_id: operatorId,
                        operator_email: operatorProfile.email,
                        operator_name: operatorProfile.full_name,
                        action_type: 'RESET_PASSWORD',
                        target_user_email: targetUser?.email || 'unknown',
                        operation_details: '重置用户密码'
                    });

                result = { message: '密码重置成功' };
                break;
            }

            case 'delete_user': {
                const { userId } = data;
                
                // 获取目标用户信息
                const { data: targetUser } = await adminSupabase
                    .from('profiles')
                    .select('email')
                    .eq('id', userId)
                    .single();

                // 删除用户
                const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId);

                if (deleteError) {
                    throw deleteError;
                }

                // 记录日志
                await adminSupabase
                    .from('user_audit_logs')
                    .insert({
                        operator_id: operatorId,
                        operator_email: operatorProfile.email,
                        operator_name: operatorProfile.full_name,
                        action_type: 'DELETE_USER',
                        target_user_email: targetUser?.email || 'unknown',
                        operation_details: `删除用户: ${targetUser?.email || 'unknown'}`
                    });

                result = { message: '用户删除成功' };
                break;
            }

            case 'update_user_status': {
                const { userId, isActive } = data;
                
                // 获取目标用户信息
                const { data: targetUser } = await adminSupabase
                    .from('profiles')
                    .select('email')
                    .eq('id', userId)
                    .single();

                // 更新用户状态（通过禁用/启用认证）
                const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
                    userId,
                    { banned: !isActive }
                );

                if (updateError) {
                    throw updateError;
                }

                // 记录日志
                await adminSupabase
                    .from('user_audit_logs')
                    .insert({
                        user_id: userId,
                        operator_id: operatorId,
                        operator_email: operatorProfile.email,
                        operator_name: operatorProfile.full_name,
                        action_type: isActive ? 'ENABLE_USER' : 'DISABLE_USER',
                        target_user_email: targetUser?.email || 'unknown',
                        operation_details: `${isActive ? '启用' : '禁用'}用户: ${targetUser?.email || 'unknown'}`
                    });

                result = { message: `用户${isActive ? '启用' : '禁用'}成功` };
                break;
            }

            default:
                throw new Error('不支持的操作类型');
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('User management error:', error);
        
        const errorResponse = {
            error: {
                code: 'USER_MANAGEMENT_ERROR',
                message: error.message || '用户管理操作失败'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});