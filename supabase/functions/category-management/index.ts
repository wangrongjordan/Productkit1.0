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
                error: { code: 'UNAUTHORIZED', message: '只有超级管理员可以执行分类管理操作' } 
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        let result;

        switch (action) {
            case 'create_category': {
                const { name, parent_id, level, description, sort_order, is_active } = data;
                
                const { data: newCategory, error: createError } = await adminSupabase
                    .from('categories')
                    .insert({
                        name,
                        parent_id,
                        level,
                        description,
                        sort_order,
                        is_active: is_active !== undefined ? is_active : true
                    })
                    .select()
                    .single();

                if (createError) {
                    throw createError;
                }

                // 记录操作日志
                await adminSupabase
                    .from('user_audit_logs')
                    .insert({
                        operator_id: operatorId,
                        operator_email: operatorProfile.email,
                        operator_name: operatorProfile.full_name,
                        action_type: 'CREATE_CATEGORY',
                        operation_details: `创建分类: ${name} (级别: ${level})`
                    });

                result = { category: newCategory, message: '分类创建成功' };
                break;
            }

            case 'update_category': {
                const { id, name, parent_id, level, description, sort_order, is_active } = data;
                
                const { data: updatedCategory, error: updateError } = await adminSupabase
                    .from('categories')
                    .update({
                        name,
                        parent_id,
                        level,
                        description,
                        sort_order,
                        is_active
                    })
                    .eq('id', id)
                    .select()
                    .single();

                if (updateError) {
                    throw updateError;
                }

                // 记录操作日志
                await adminSupabase
                    .from('user_audit_logs')
                    .insert({
                        operator_id: operatorId,
                        operator_email: operatorProfile.email,
                        operator_name: operatorProfile.full_name,
                        action_type: 'UPDATE_CATEGORY',
                        operation_details: `更新分类: ${name} (ID: ${id})`
                    });

                result = { category: updatedCategory, message: '分类更新成功' };
                break;
            }

            case 'delete_category': {
                const { id, name } = data;

                // 检查是否有子分类
                const { data: children, error: childrenError } = await adminSupabase
                    .from('categories')
                    .select('id')
                    .eq('parent_id', id);

                if (childrenError) {
                    throw childrenError;
                }

                if (children && children.length > 0) {
                    return new Response(JSON.stringify({ 
                        error: { code: 'HAS_CHILDREN', message: '该分类下还有子分类，请先删除子分类' } 
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                // 检查是否有关联的产品
                const { data: products, error: productsError } = await adminSupabase
                    .from('products')
                    .select('id')
                    .or(`level_1_category.eq.${name},level_2_category.eq.${name},level_3_category.eq.${name}`);

                if (productsError) {
                    throw productsError;
                }

                if (products && products.length > 0) {
                    return new Response(JSON.stringify({ 
                        error: { code: 'HAS_PRODUCTS', message: `该分类下还有 ${products.length} 个产品，无法删除` } 
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                // 执行删除操作
                const { error: deleteError } = await adminSupabase
                    .from('categories')
                    .delete()
                    .eq('id', id);

                if (deleteError) {
                    throw deleteError;
                }

                // 记录操作日志
                await adminSupabase
                    .from('user_audit_logs')
                    .insert({
                        operator_id: operatorId,
                        operator_email: operatorProfile.email,
                        operator_name: operatorProfile.full_name,
                        action_type: 'DELETE_CATEGORY',
                        operation_details: `删除分类: ${name} (ID: ${id})`
                    });

                result = { message: '分类删除成功' };
                break;
            }

            case 'toggle_category_status': {
                const { id, name, is_active } = data;

                const { error: toggleError } = await adminSupabase
                    .from('categories')
                    .update({ is_active: !is_active })
                    .eq('id', id);

                if (toggleError) {
                    throw toggleError;
                }

                // 记录操作日志
                await adminSupabase
                    .from('user_audit_logs')
                    .insert({
                        operator_id: operatorId,
                        operator_email: operatorProfile.email,
                        operator_name: operatorProfile.full_name,
                        action_type: 'TOGGLE_CATEGORY_STATUS',
                        operation_details: `${!is_active ? '显示' : '隐藏'}分类: ${name} (ID: ${id})`
                    });

                result = { message: `分类已${!is_active ? '显示' : '隐藏'}` };
                break;
            }

            default:
                throw new Error('不支持的操作类型');
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Category management error:', error);
        
        const errorResponse = {
            error: {
                code: 'CATEGORY_MANAGEMENT_ERROR',
                message: error.message || '分类管理操作失败'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
