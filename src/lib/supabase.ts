import { createClient } from '@supabase/supabase-js'
import { supabaseUrl, supabaseAnonKey } from './supabase-config'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: 'user' | 'admin' | 'superadmin'
  created_at: string
  updated_at: string
}

export interface ProductCategory {
  id: number
  name: string
  parent_id: number | null
  level: number
  image_url: string | null
  description: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  product_code: string
  level_1_category: string
  level_2_category: string
  level_3_category: string
  product_name: string
  workshop: string | null
  finance_category: string | null
  markid_name: string | null
  markid: number | null
  auto_bom: boolean
  design_identifier: string | null
  area_formula: string | null
  tax_rate: number | null
  value_mode: string | null
  algorithm_type: string | null
  cover_type: string | null
  is_customizable: boolean
  is_hardshell: boolean
  product_features: string | null
  production_process: string | null
  application_scenarios: string | null
  customer_service_scripts: string | null
  minimum_order_quantity: string | null
  size: string | null
  style: string | null
  material: string | null
  color: string | null
  minimum_order: string | null
  printing_method: string | null
  post_processing: string | null
  accessories: string | null
  customization_area: string | null
  pricing_format: string | null
  design_order: string | null
  note_format: string | null
  weight_specs: string | null
  packaging_method: string | null
  delivery_time: string | null
  supports_custom_specs: boolean
  has_physical_sample: boolean
  supports_sample_viewing: boolean
  shipping_location_outsource: string | null
  positioning_usage: string | null
  selling_points: string | null
  status: 'active' | 'inactive' | 'draft'
  created_at: string
  updated_at: string
}

export interface UserFavorite {
  id: number
  user_id: string
  product_id: number
  created_at: string
}

// 产品审计日志接口
export interface ProductAuditLog {
  id: number
  user_id: string | null
  user_email: string
  user_name: string | null
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE' | 'BULK_DELETE' | 'IMPORT' | 'SUBMIT_CHANGE'
  table_name: string
  record_id: number | null
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  affected_records_count: number
  operation_details: string | null
  ip_address: string | null
  created_at: string
}

// 产品列表查询参数
export interface ProductListParams {
  page?: number
  pageSize?: number
  search?: string
  category?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 产品列表响应
export interface ProductListResponse {
  products: Product[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 批量操作参数
export interface BulkOperationParams {
  operation: 'bulk_update_status' | 'bulk_delete' | 'bulk_update_fields'
  productIds: number[]
  updateData?: Record<string, any>
  userInfo?: {
    id: string
    email: string
    name?: string
  }
}
