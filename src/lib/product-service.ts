// 产品管理相关的API服务函数
import { supabase, type Product, type ProductListParams, type ProductListResponse, type BulkOperationParams, type ProductAuditLog } from './supabase'

// 获取产品列表（带分页和筛选）
export async function getProductList(params: ProductListParams = {}): Promise<ProductListResponse> {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    category = '',
    status = '',
    dateFrom = '',
    dateTo = '',
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = params

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })

  // 搜索条件
  if (search) {
    query = query.or(`product_name.ilike.%${search}%,product_code.ilike.%${search}%`)
  }

  // 分类筛选
  if (category) {
    query = query.eq('level_1_category', category)
  }

  // 状态筛选
  if (status) {
    query = query.eq('status', status)
  }

  // 日期范围筛选
  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo)
  }

  // 排序
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // 分页
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data: products, error, count } = await query

  if (error) throw error

  return {
    products: products || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
}

// 获取所有分类（用于筛选）
export async function getProductCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('level_1_category')
    .not('level_1_category', 'is', null)

  if (error) throw error

  const categories = [...new Set(data.map(item => item.level_1_category))]
  return categories.sort()
}

// 批量更新产品状态
export async function bulkUpdateProductStatus(productIds: number[], status: string, userInfo?: any): Promise<{ success: boolean, affectedCount: number }> {
  const { error, count } = await supabase
    .from('products')
    .update({ status, updated_at: new Date().toISOString() })
    .in('id', productIds)
    .select('id')

  if (error) throw error

  const affectedCount = Array.isArray(count) ? count.length : 0

  // 记录审计日志
  await recordAuditLog({
    user_id: userInfo?.id || null,
    user_email: userInfo?.email || 'unknown',
    user_name: userInfo?.full_name || null,
    action_type: 'BULK_UPDATE',
    affected_records_count: affectedCount,
    operation_details: `批量更新 ${affectedCount} 个产品状态为: ${status}`,
    new_values: { status }
  })

  return {
    success: true,
    affectedCount
  }
}

// 批量删除产品
export async function bulkDeleteProducts(productIds: number[], userInfo?: any): Promise<{ success: boolean, affectedCount: number }> {
  const { error, count } = await supabase
    .from('products')
    .delete()
    .in('id', productIds)
    .select('id')

  if (error) throw error

  const affectedCount = Array.isArray(count) ? count.length : 0

  // 记录审计日志
  await recordAuditLog({
    user_id: userInfo?.id || null,
    user_email: userInfo?.email || 'unknown',
    user_name: userInfo?.full_name || null,
    action_type: 'BULK_DELETE',
    affected_records_count: affectedCount,
    operation_details: `批量删除 ${affectedCount} 个产品`
  })

  return {
    success: true,
    affectedCount
  }
}

// 批量更新产品字段
export async function bulkUpdateProductFields(productIds: number[], updateData: Record<string, any>, userInfo?: any): Promise<{ success: boolean, affectedCount: number }> {
  const updatePayload = {
    ...updateData,
    updated_at: new Date().toISOString()
  }

  const { error, count } = await supabase
    .from('products')
    .update(updatePayload)
    .in('id', productIds)
    .select('id')

  if (error) throw error

  const affectedCount = Array.isArray(count) ? count.length : 0

  // 记录审计日志
  const fieldNames = Object.keys(updateData).join(', ')
  await recordAuditLog({
    user_id: userInfo?.id || null,
    user_email: userInfo?.email || 'unknown',
    user_name: userInfo?.full_name || null,
    action_type: 'BULK_UPDATE',
    affected_records_count: affectedCount,
    operation_details: `批量更新 ${affectedCount} 个产品的字段: ${fieldNames}`,
    new_values: updateData
  })

  return {
    success: true,
    affectedCount
  }
}

// 创建新产品
export async function createProduct(productData: Partial<Product>, userInfo?: any): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert([{
      ...productData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) throw error

  // 记录审计日志
  await recordAuditLog({
    user_id: userInfo?.id || null,
    user_email: userInfo?.email || 'unknown',
    user_name: userInfo?.full_name || null,
    action_type: 'CREATE',
    record_id: data.id,
    affected_records_count: 1,
    operation_details: `创建新产品: ${data.product_name} (${data.product_code})`,
    new_values: data
  })

  return data
}

// 更新产品
export async function updateProduct(productId: number, productData: Partial<Product>, userInfo?: any): Promise<Product> {
  // 获取原始数据
  const { data: oldData } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  const { data, error } = await supabase
    .from('products')
    .update({
      ...productData,
      updated_at: new Date().toISOString()
    })
    .eq('id', productId)
    .select()
    .single()

  if (error) throw error

  // 记录审计日志
  await recordAuditLog({
    user_id: userInfo?.id || null,
    user_email: userInfo?.email || 'unknown',
    user_name: userInfo?.full_name || null,
    action_type: 'UPDATE',
    record_id: productId,
    affected_records_count: 1,
    operation_details: `更新产品: ${data.product_name} (${data.product_code})`,
    old_values: oldData,
    new_values: data
  })

  return data
}

// 删除产品
export async function deleteProduct(productId: number, userInfo?: any): Promise<void> {
  // 获取产品信息用于日志
  const { data: productData } = await supabase
    .from('products')
    .select('product_name, product_code')
    .eq('id', productId)
    .single()

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) throw error

  // 记录审计日志
  await recordAuditLog({
    user_id: userInfo?.id || null,
    user_email: userInfo?.email || 'unknown',
    user_name: userInfo?.full_name || null,
    action_type: 'DELETE',
    record_id: productId,
    affected_records_count: 1,
    operation_details: `删除产品: ${productData?.product_name} (${productData?.product_code})`
  })
}

// 记录审计日志
export async function recordAuditLog(logData: Partial<ProductAuditLog>): Promise<void> {
  const { error } = await supabase
    .from('product_audit_logs')
    .insert([{
      ...logData,
      created_at: new Date().toISOString()
    }])

  if (error) {
    console.error('Failed to record audit log:', error)
    // 不抛出错误，避免影响主要操作
  }
}

// 获取审计日志
export async function getAuditLogs(page = 1, pageSize = 20): Promise<{ logs: ProductAuditLog[], total: number, totalPages: number }> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('product_audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  return {
    logs: data || [],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize)
  }
}

// 数据导入功能
export interface ImportResult {
  success: boolean
  results?: {
    totalRows: number
    successCount: number
    errorCount: number
    errors?: Array<{ row: number; message: string; data?: any }>
  }
  errors?: string[]
}

// 批量导入产品数据
export async function importProducts(importData: Record<string, any>[], userInfo?: any): Promise<ImportResult> {
  if (!importData || importData.length === 0) {
    return {
      success: false,
      errors: ['没有可导入的数据']
    }
  }

  const results = {
    totalRows: importData.length,
    successCount: 0,
    errorCount: 0,
    errors: [] as Array<{ row: number; message: string; data?: any }>
  }

  // 字段映射配置
  const fieldMapping: Record<string, string> = {
    '产品名称': 'product_name',
    '产品名称*': 'product_name',
    '产品编码': 'product_code',
    '产品编码*': 'product_code',
    '一级分类': 'level_1_category',
    '一级分类*': 'level_1_category',
    '二级分类': 'level_2_category',
    '二级分类*': 'level_2_category',
    '三级分类': 'level_3_category',
    '三级分类*': 'level_3_category',
    '产品特性': 'product_features',
    '尺寸': 'size',
    '款式': 'style',
    '材质': 'material',
    '颜色': 'color',
    '起订量': 'minimum_order',
    '印刷方式': 'printing_method',
    '后道工艺': 'post_processing',
    '产品配件': 'accessories',
    '定制区域': 'customization_area',
    '产品报价形式': 'pricing_format',
    '设计发单': 'design_order',
    '备注格式': 'note_format',
    '产品重量': 'weight_specs',
    '包装方式': 'packaging_method',
    '发货时效': 'delivery_time',
    '发货地及外协': 'shipping_location_outsource',
    '产品定位/使用场景': 'positioning_usage',
    '产品卖点': 'selling_points',
    '支持特殊尺寸': 'supports_custom_specs',
    '有实物样品': 'has_physical_sample',
    '支持看样': 'supports_sample_viewing',
    '状态': 'status'
  }

  // 必填字段
  const requiredFields = ['product_name', 'product_code', 'level_1_category']

  const validProducts: Partial<Product>[] = []

  // 验证和转换每一行数据
  for (let i = 0; i < importData.length; i++) {
    const row = importData[i]
    const rowNumber = i + 2 // Excel行号（从2开始，因为第1行是标题）
    
    try {
      // 转换字段名
      const convertedRow: Record<string, any> = {}
      
      Object.keys(row).forEach(key => {
        const mappedField = fieldMapping[key.trim()]
        if (mappedField && row[key] !== null && row[key] !== undefined) {
          let value = String(row[key]).trim()
          
          // 特殊字段处理
          if (mappedField === 'supports_custom_specs' || mappedField === 'has_physical_sample' || mappedField === 'supports_sample_viewing') {
            convertedRow[mappedField] = ['是', 'true', '1', 'True', 'TRUE'].includes(value)
          } else if (mappedField === 'status') {
            const statusMap: Record<string, string> = {
              '启用': 'active',
              '停用': 'inactive', 
              '草稿': 'draft',
              'active': 'active',
              'inactive': 'inactive',
              'draft': 'draft'
            }
            convertedRow[mappedField] = statusMap[value] || 'active'
          } else if (value) {
            convertedRow[mappedField] = value
          }
        }
      })

      // 验证必填字段
      const missingFields = requiredFields.filter(field => !convertedRow[field])
      if (missingFields.length > 0) {
        results.errors.push({
          row: rowNumber,
          message: `缺少必填字段: ${missingFields.join(', ')}`,
          data: row
        })
        results.errorCount++
        continue
      }

      // 验证产品编码唯一性（在导入数据内）
      const duplicateInImport = validProducts.find(p => p.product_code === convertedRow.product_code)
      if (duplicateInImport) {
        results.errors.push({
          row: rowNumber,
          message: `产品编码 "${convertedRow.product_code}" 在导入数据中重复`,
          data: row
        })
        results.errorCount++
        continue
      }

      // 检查数据库中是否已存在相同产品编码
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('product_code', convertedRow.product_code)
        .single()
        
      if (existingProduct) {
        results.errors.push({
          row: rowNumber,
          message: `产品编码 "${convertedRow.product_code}" 已存在`,
          data: row
        })
        results.errorCount++
        continue
      }

      // 添加创建和更新时间
      convertedRow.created_at = new Date().toISOString()
      convertedRow.updated_at = new Date().toISOString()
      
      // 设置默认值
      if (!convertedRow.status) convertedRow.status = 'active'
      if (!convertedRow.supports_custom_specs) convertedRow.supports_custom_specs = false
      if (!convertedRow.has_physical_sample) convertedRow.has_physical_sample = false
      if (!convertedRow.supports_sample_viewing) convertedRow.supports_sample_viewing = false
      if (!convertedRow.is_customizable) convertedRow.is_customizable = false
      if (!convertedRow.auto_bom) convertedRow.auto_bom = false
      
      validProducts.push(convertedRow as Partial<Product>)
      
    } catch (error: any) {
      results.errors.push({
        row: rowNumber,
        message: `数据处理错误: ${error.message}`,
        data: row
      })
      results.errorCount++
    }
  }

  // 如果有有效数据，批量插入
  if (validProducts.length > 0) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(validProducts)
        .select('id')
      
      if (error) {
        console.error('Bulk insert error:', error)
        return {
          success: false,
          errors: [`数据库插入失败: ${error.message}`]
        }
      }
      
      results.successCount = data?.length || 0
      
      // 记录审计日志
      await recordAuditLog({
        user_id: userInfo?.id || null,
        user_email: userInfo?.email || 'unknown',
        user_name: userInfo?.full_name || null,
        action_type: 'IMPORT',
        affected_records_count: results.successCount,
        operation_details: `批量导入 ${results.successCount} 个产品，失败 ${results.errorCount} 个`
      })
      
    } catch (error: any) {
      console.error('Import error:', error)
      return {
        success: false,
        errors: [`导入失败: ${error.message}`]
      }
    }
  }

  return {
    success: results.errorCount < results.totalRows, // 只要有成功的就算部分成功
    results
  }
}
export async function exportProductsToCSV(params: ProductListParams = {}): Promise<void> {
  try {
    // 获取所有符合条件的产品（不分页）
    const result = await getProductList({
      ...params,
      page: 1,
      pageSize: 10000 // 获取大量数据
    })

    const csvContent = generateCSVContent(result.products)

    // 添加UTF-8 BOM以确保Excel正确显示中文字符
    const BOM = '\uFEFF'
    const csvWithBOM = BOM + csvContent

    // 创建并下载文件
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `产品数据_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export error:', error)
    throw error
  }
}

// 生成CSV内容
function generateCSVContent(products: Product[]): string {
  const headers = [
    '产品名称', '产品编码', '一级分类', '二级分类', '三级分类',
    '产品特性', '尺寸', '款式', '材质', '颜色', '起订量',
    '印刷方式', '后道工艺', '产品配件', '定制区域',
    '产品报价形式', '设计发单', '备注格式', '产品重量',
    '包装方式', '发货时效', '发货地及外协', '产品定位/使用场景',
    '产品卖点', '支持特殊尺寸', '有实物样品', '支持看样', '状态',
    '创建时间', '更新时间'
  ]

  const rows = products.map(product => [
    product.product_name || '',
    product.product_code || '',
    product.level_1_category || '',
    product.level_2_category || '',
    product.level_3_category || '',
    product.product_features || '',
    product.size || '',
    product.style || '',
    product.material || '',
    product.color || '',
    product.minimum_order || '',
    product.printing_method || '',
    product.post_processing || '',
    product.accessories || '',
    product.customization_area || '',
    product.pricing_format || '',
    product.design_order || '',
    product.note_format || '',
    product.weight_specs || '',
    product.packaging_method || '',
    product.delivery_time || '',
    product.shipping_location_outsource || '',
    product.positioning_usage || '',
    product.selling_points || '',
    product.supports_custom_specs ? '是' : '否',
    product.has_physical_sample ? '是' : '否',
    product.supports_sample_viewing ? '是' : '否',
    getStatusText(product.status),
    new Date(product.created_at).toLocaleDateString(),
    new Date(product.updated_at).toLocaleDateString()
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  return csvContent
}

// 获取状态文本
function getStatusText(status: string): string {
  switch (status) {
    case 'active': return '启用'
    case 'inactive': return '停用'
    case 'draft': return '草稿'
    default: return status
  }
}

// 提交产品修改申请到审批队列
 export async function submitProductChanges(
  productId: number,
  changes: Partial<Product>,
  userInfo: { id: string; email: string; name?: string }
): Promise<{ success: boolean; change_id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('pending_changes')
      .insert({
        product_id: productId,
        user_id: userInfo.id,
        changes: changes,
        status: 'pending'
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error submitting changes:', error)
      return { success: false, error: error.message }
    }

    // 记录审计日志
    await recordAuditLog({
      user_id: userInfo.id,
      user_email: userInfo.email,
      user_name: userInfo.name || null,
      action_type: 'SUBMIT_CHANGE',
      record_id: productId,
      operation_details: `提交产品修改申请，等待审批`
    })

    return { success: true, change_id: data.id }
  } catch (error: any) {
    console.error('Error submitting product changes:', error)
    return { success: false, error: error.message }
  }
}