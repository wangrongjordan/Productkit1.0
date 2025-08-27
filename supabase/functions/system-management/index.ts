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
            case 'upload_logo': {
                const { fileName, fileData, fileType } = data;
                
                // 解码base64文件数据
                const fileBytes = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));
                
                // 上传到存储桶
                const { data: uploadData, error: uploadError } = await adminSupabase.storage
                    .from('system-assets')
                    .upload(`logo/${fileName}`, fileBytes, {
                        contentType: fileType,
                        upsert: true
                    });

                if (uploadError) {
                    throw uploadError;
                }

                // 获取公开URL
                const { data: urlData } = await adminSupabase.storage
                    .from('system-assets')
                    .getPublicUrl(`logo/${fileName}`);

                // 更新系统设置
                const { error: settingError } = await adminSupabase
                    .from('system_settings')
                    .upsert({
                        setting_key: 'company_logo_url',
                        setting_value: urlData.publicUrl,
                        setting_type: 'image',
                        description: '企业LOGO图片URL'
                    }, { onConflict: 'setting_key' });

                if (settingError) {
                    throw settingError;
                }

                // 记录日志
                await adminSupabase
                    .from('user_audit_logs')
                    .insert({
                        operator_id: operatorId,
                        operator_email: operatorProfile.email,
                        operator_name: operatorProfile.full_name,
                        action_type: 'UPLOAD_LOGO',
                        operation_details: `上传企业LOGO: ${fileName}`
                    });

                result = { 
                    message: 'LOGO上传成功', 
                    url: urlData.publicUrl,
                    fileName: fileName
                };
                break;
            }

            case 'get_logo': {
                const { data: setting, error: settingError } = await adminSupabase
                    .from('system_settings')
                    .select('setting_value')
                    .eq('setting_key', 'company_logo_url')
                    .single();

                if (settingError && settingError.code !== 'PGRST116') {
                    throw settingError;
                }

                result = { 
                    logoUrl: setting?.setting_value || null
                };
                break;
            }

            case 'get_system_settings': {
                const { data: settings, error: settingsError } = await adminSupabase
                    .from('system_settings')
                    .select('*');

                if (settingsError) {
                    throw settingsError;
                }

                result = { settings };
                break;
            }

            case 'update_setting': {
                const { key, value, type, description } = data;
                
                const { error: settingError } = await adminSupabase
                    .from('system_settings')
                    .upsert({
                        setting_key: key,
                        setting_value: value,
                        setting_type: type || 'text',
                        description: description || ''
                    }, { onConflict: 'setting_key' });

                if (settingError) {
                    throw settingError;
                }

                // 记录日志
                await adminSupabase
                    .from('user_audit_logs')
                    .insert({
                        operator_id: operatorId,
                        operator_email: operatorProfile.email,
                        operator_name: operatorProfile.full_name,
                        action_type: 'UPDATE_SYSTEM_SETTING',
                        operation_details: `更新系统设置: ${key} = ${value}`
                    });

                result = { message: '系统设置更新成功' };
                break;
            }

            default:
                throw new Error('不支持的操作类型');
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('System management error:', error);
        
        const errorResponse = {
            error: {
                code: 'SYSTEM_MANAGEMENT_ERROR',
                message: error.message || '系统管理操作失败'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});