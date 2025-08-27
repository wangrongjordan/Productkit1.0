import { supabase } from './supabase'

interface CategoryData {
  name: string
  parent_id?: number | null
  level: number
  description?: string
  sort_order?: number
  is_active?: boolean
}

interface CategoryManagementResponse {
  data?: any
  error?: { code: string; message: string }
}

// 分类管理服务类
export class CategoryManagementService {
  private static async callCategoryManagementFunction(action: string, data: any): Promise<CategoryManagementResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('用户未登录')
      }

      const { data: result, error } = await supabase.functions.invoke('category-management', {
        body: {
          action,
          data,
          operatorId: user.id
        }
      })

      if (error) {
        return { error: { code: 'FUNCTION_ERROR', message: error.message } }
      }

      return result
    } catch (error: any) {
      return { error: { code: 'SERVICE_ERROR', message: error.message } }
    }
  }

  // 创建新分类
  static async createCategory(categoryData: CategoryData): Promise<CategoryManagementResponse> {
    return this.callCategoryManagementFunction('create_category', categoryData)
  }

  // 更新分类
  static async updateCategory(id: number, categoryData: CategoryData): Promise<CategoryManagementResponse> {
    return this.callCategoryManagementFunction('update_category', { id, ...categoryData })
  }

  // 删除分类
  static async deleteCategory(id: number, name: string): Promise<CategoryManagementResponse> {
    return this.callCategoryManagementFunction('delete_category', { id, name })
  }

  // 切换分类显示/隐藏状态
  static async toggleCategoryStatus(id: number, name: string, is_active: boolean): Promise<CategoryManagementResponse> {
    return this.callCategoryManagementFunction('toggle_category_status', { id, name, is_active })
  }

  // 获取分类列表（使用现有的查询）
  static async getCategories() {
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select(`
          *,
          children:categories!parent_id (
            *,
            children:categories!parent_id (*)
          )
        `)
        .is('parent_id', null)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      
      if (error) throw error

      // 获取产品数量统计
      const { data: productCounts } = await supabase
        .from('products')
        .select('level_1_category, level_2_category, level_3_category')
      
      // 计算每个分类的产品数量
      const countByCategory: Record<string, number> = {}
      productCounts?.forEach(product => {
        if (product.level_1_category) {
          countByCategory[product.level_1_category] = (countByCategory[product.level_1_category] || 0) + 1
        }
        if (product.level_2_category) {
          countByCategory[product.level_2_category] = (countByCategory[product.level_2_category] || 0) + 1
        }
        if (product.level_3_category) {
          countByCategory[product.level_3_category] = (countByCategory[product.level_3_category] || 0) + 1
        }
      })

      // 为分类数据添加产品数量
      const enrichCategories = (categories: any[]): any[] => {
        return categories.map(category => ({
          ...category,
          product_count: countByCategory[category.name] || 0,
          children: category.children ? enrichCategories(category.children) : []
        }))
      }

      const enrichedCategories = enrichCategories(categories || [])

      return { data: enrichedCategories, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'QUERY_ERROR', message: error.message } }
    }
  }

  // 获取所有分类（平均列表）
  static async getAllCategoriesFlat() {
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true })
      
      if (error) throw error

      return { data: categories, error: null }
    } catch (error: any) {
      return { data: null, error: { code: 'QUERY_ERROR', message: error.message } }
    }
  }
}

export default CategoryManagementService
