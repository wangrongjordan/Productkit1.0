import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, User, LogOut, Search, Grid3x3, List, Eye } from 'lucide-react'
import { supabase, type Product, type UserFavorite } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface FavoriteProduct extends Product {
  favorite_id: number
  favorited_at: string
}

const Dashboard: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteProduct[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadFavorites()
  }, [user, navigate])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = favorites.filter(product => 
        product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.level_1_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.level_2_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.level_3_category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredFavorites(filtered)
    } else {
      setFilteredFavorites(favorites)
    }
  }, [searchQuery, favorites])

  async function loadFavorites() {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Get user's favorite products
      const { data: favoriteData, error: favoriteError } = await supabase
        .from('user_favorites')
        .select('id, product_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (favoriteError) throw favoriteError

      if (favoriteData && favoriteData.length > 0) {
        // Get product details
        const productIds = favoriteData.map(fav => fav.product_id)
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds)

        if (productError) throw productError

        // Combine favorite and product data
        const favoritesWithProducts = favoriteData.map(fav => {
          const product = productData?.find(p => p.id === fav.product_id)
          return {
            ...product!,
            favorite_id: fav.id,
            favorited_at: fav.created_at
          }
        }).filter(Boolean) as FavoriteProduct[]

        setFavorites(favoritesWithProducts)
      }
    } catch (error: any) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  async function removeFavorite(favoriteId: number) {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', favoriteId)

      if (error) throw error

      // Update local state
      setFavorites(prev => prev.filter(fav => fav.favorite_id !== favoriteId))
    } catch (error: any) {
      console.error('Error removing favorite:', error)
      alert('删除失败，请稍后再试')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                产品知识平台
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">用户控制台</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">{profile?.full_name || user.email}</span>
              </div>
              
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">退出</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            欢迎回来，{profile?.full_name || '用户'}
          </h1>
          <p className="text-gray-600">
            管理您的产品收藏和个人设置
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="apple-card text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{favorites.length}</div>
            <div className="text-gray-600">收藏产品</div>
          </div>
          
          <div className="apple-card text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {new Set(favorites.map(f => f.level_1_category)).size}
            </div>
            <div className="text-gray-600">关注分类</div>
          </div>
          
          <div className="apple-card text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '今日'}
            </div>
            <div className="text-gray-600">加入日期</div>
          </div>
        </div>

        {/* Favorites Section */}
        <div className="apple-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
              我的收藏 ({filteredFavorites.length})
            </h2>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索收藏产品..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">正在加载收藏...</p>
            </div>
          ) : filteredFavorites.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {searchQuery ? '未找到匹配的产品' : '您还没有收藏任何产品'}
              </p>
              <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">
                去发现产品
              </Link>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {filteredFavorites.map((product) => (
                <div
                  key={product.favorite_id}
                  className={viewMode === 'grid' 
                    ? 'bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 group'
                    : 'bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 group flex items-center space-x-6'
                  }
                >
                  <div className={viewMode === 'grid' ? '' : 'flex-1'}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-block px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md">
                        {product.level_1_category}
                      </span>
                      <button
                        onClick={() => removeFavorite(product.favorite_id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="取消收藏"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {product.product_name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {product.level_2_category} • {product.level_3_category}
                    </p>
                    
                    {product.product_features && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {product.product_features}
                      </p>
                    )}
                    
                    <div className="text-xs text-gray-400">
                      收藏于 {new Date(product.favorited_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  
                  <div className={viewMode === 'grid' ? 'mt-4' : ''}>
                    <Link
                      to={`/product/${product.id}`}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>查看详情</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
