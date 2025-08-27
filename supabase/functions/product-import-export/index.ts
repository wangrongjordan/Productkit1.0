// 产品数据导入导出 Edge Function
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
    const url = new URL(req.url);
    const operation = url.searchParams.get('operation');

    if (operation === 'export') {
      // 导出产品数据
      const filters = {
        category: url.searchParams.get('category'),
        status: url.searchParams.get('status'),
        dateFrom: url.searchParams.get('dateFrom'),
        dateTo: url.searchParams.get('dateTo')
      };

      // 模拟导出数据
      const exportData = {
        headers: [
          '产品名称', '产品编码', '一级分类', '二级分类', '三级分类',
          '产品特性', '尺寸', '款式', '材质', '颜色', '起订量',
          '印刷方式', '后道工艺', '产品配件', '定制区域',
          '产品报价形式', '设计发单', '备注格式', '产品重量',
          '包装方式', '发货时效', '发货地及外协', '产品定位/使用场景',
          '产品卖点', '状态', '创建时间', '更新时间'
        ],
        data: [
          // 这里应该从数据库查询实际数据
        ],
        totalRecords: 0,
        filters: filters,
        exportedAt: new Date().toISOString()
      };

      return new Response(JSON.stringify({ data: exportData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (operation === 'import') {
      // 导入产品数据
      const requestData = await req.json();
      const { csvData, userInfo } = requestData;

      // 模拟导入处理
      const importResult = {
        success: true,
        totalRows: csvData?.length || 0,
        successCount: csvData?.length || 0,
        errorCount: 0,
        errors: [],
        warnings: []
      };

      // 记录导入审计日志
      const auditLog = {
        user_id: userInfo?.id || null,
        user_email: userInfo?.email || 'unknown',
        user_name: userInfo?.name || 'unknown',
        action_type: 'IMPORT',
        affected_records_count: importResult.successCount,
        operation_details: `批量导入 ${importResult.totalRows} 条产品数据，成功 ${importResult.successCount} 条`,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      };

      console.log('Import audit log:', auditLog);

      return new Response(JSON.stringify({ data: importResult }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (operation === 'template') {
      // 返回导入模板
      const template = {
        headers: [
          '产品名称*', '产品编码*', '一级分类*', '二级分类*', '三级分类*',
          '产品特性', '尺寸', '款式', '材质', '颜色', '起订量',
          '印刷方式', '后道工艺', '产品配件', '定制区域',
          '产品报价形式', '设计发单', '备注格式', '产品重量',
          '包装方式', '发货时效', '发货地及外协', '产品定位/使用场景',
          '产品卖点', '支持特殊尺寸', '有实物样品', '支持看样', '状态'
        ],
        sample: [
          [
            '示例产品名称', 'SAMPLE001', '电子产品', '手机配件', '手机壳',
            '高品质材料，精美设计', '15cm x 8cm', '时尚款',
            '硅胶+PC', '黑色/白色', '100个起订',
            '丝印', 'UV处理', '包装盒+说明书', '背面下方',
            '阶梯报价', '提供设计稿', '备注：定制LOGO',
            '约50g', '纸盒包装', '5-7个工作日',
            '深圳发货，非外协', '适用于日常防护',
            '防摔耐用，手感舒适', 'true', 'true', 'true', 'active'
          ]
        ]
      };

      return new Response(JSON.stringify({ data: template }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid operation');

  } catch (error) {
    console.error('Import/Export error:', error);
    
    return new Response(JSON.stringify({
      error: {
        code: 'IMPORT_EXPORT_ERROR',
        message: error.message || '导入导出操作失败'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});