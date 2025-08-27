import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Share2, Download, Tag, Settings, Package, Wrench, Truck, DollarSign, FileText, CheckCircle, XCircle, Info, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase, type Product } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // 展开/收起状态管理
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    technical: true,
    pricing: true,
    logistics: true,
    features: true
  })

  useEffect(() => {
    if (id) {
      loadProduct()
    }
  }, [id])

  async function loadProduct() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        setError('产品未找到')
        return
      }

      setProduct(data)
    } catch (error: any) {
      console.error('Error loading product:', error)
      setError('加载产品信息失败')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-apple-gray flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">正在加载产品信息...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-apple-gray flex items-center justify-center">
        <div className="text-center">
          <div className="text-apple-error text-6xl mb-4">404</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">产品未找到</h1>
          <p className="text-text-secondary mb-6">{error || '请检查链接是否正确'}</p>
          <Link to="/" className="inline-flex items-center px-6 py-3 bg-apple-blue text-white rounded-lg hover:bg-apple-blue-dark transition-colors">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-apple-gray">
      {/* Navigation */}
      <nav className="bg-apple-white border-b border-border-light sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 text-apple-blue hover:text-apple-blue-dark transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">返回首页</span>
            </Link>
            <h1 className="text-lg font-semibold text-text-primary truncate max-w-md">
              {product.product_name}
            </h1>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-text-tertiary hover:text-apple-blue hover:bg-apple-blue-100 rounded-lg transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Product Header */}
            <div className="bg-apple-white rounded-xl shadow-sm border border-border-light p-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-block px-3 py-1 text-sm font-medium text-apple-blue-700 bg-apple-blue-100 rounded-md">
                  {product.level_1_category}
                </span>
                <span className="inline-block px-3 py-1 text-sm font-medium text-apple-blue-600 bg-apple-blue-subtle rounded-md">
                  {product.level_2_category}
                </span>
                <span className="inline-block px-3 py-1 text-sm font-medium text-apple-blue-600 bg-apple-blue-subtle rounded-md">
                  {product.level_3_category}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-text-primary mb-4">
                {product.product_name}
              </h1>
              
              <div className="flex items-center text-sm text-text-secondary mb-4">
                <Tag className="w-4 h-4 mr-2 text-apple-blue" />
                <span>产品编码：<span className="font-medium text-text-primary">{product.product_code}</span></span>
              </div>

              {product.product_features && (
                <p className="text-text-secondary text-lg leading-relaxed">
                  {product.product_features}
                </p>
              )}
            </div>

            {/* Basic Information */}
            <div className="bg-apple-white rounded-xl shadow-sm border border-border-light overflow-hidden">
              <button 
                onClick={() => toggleSection('basic')}
                className="w-full flex items-center justify-between p-6 hover:bg-apple-blue-100 transition-colors"
              >
                <h3 className="flex items-center text-xl font-semibold text-text-primary">
                  <Package className="w-5 h-5 mr-2 text-apple-blue" />
                  基本信息
                </h3>
                {expandedSections.basic ? 
                  <ChevronUp className="w-5 h-5 text-apple-blue" /> : 
                  <ChevronDown className="w-5 h-5 text-apple-blue" />
                }
              </button>
              
              {expandedSections.basic && (
                <div className="px-6 pb-6 transition-all duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.size && (
                      <div className="bg-apple-blue-100 border border-apple-blue-200 p-4 rounded-lg">
                        <dt className="font-medium text-apple-blue-800 mb-1">尺寸</dt>
                        <dd className="text-apple-blue-700">{product.size}</dd>
                      </div>
                    )}
                    {product.style && (
                      <div className="bg-apple-blue-100 border border-apple-blue-200 p-4 rounded-lg">
                        <dt className="font-medium text-apple-blue-800 mb-1">款式</dt>
                        <dd className="text-apple-blue-700">{product.style}</dd>
                      </div>
                    )}
                    {product.material && (
                      <div className="bg-apple-blue-200 border border-apple-blue-300 p-4 rounded-lg">
                        <dt className="font-medium text-apple-blue-800 mb-1">材质</dt>
                        <dd className="text-apple-blue-700">{product.material}</dd>
                      </div>
                    )}
                    {product.color && (
                      <div className="bg-apple-blue-200 border border-apple-blue-300 p-4 rounded-lg">
                        <dt className="font-medium text-apple-blue-800 mb-1">颜色</dt>
                        <dd className="text-apple-blue-700">{product.color}</dd>
                      </div>
                    )}
                    {product.minimum_order && (
                      <div className="bg-apple-blue-300 border border-apple-blue-400 p-4 rounded-lg">
                        <dt className="font-medium text-apple-blue-900 mb-1">起订量</dt>
                        <dd className="text-apple-blue-800">{product.minimum_order}</dd>
                      </div>
                    )}
                    {product.weight_specs && (
                      <div className="bg-apple-blue-300 border border-apple-blue-400 p-4 rounded-lg">
                        <dt className="font-medium text-apple-blue-900 mb-1">产品重量（款式多附表格）</dt>
                        <dd className="text-apple-blue-800">{product.weight_specs}</dd>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Technical Specifications */}
            <div className="bg-apple-white rounded-xl shadow-sm border border-border-light overflow-hidden">
              <button 
                onClick={() => toggleSection('technical')}
                className="w-full flex items-center justify-between p-6 hover:bg-apple-blue-100 transition-colors"
              >
                <h3 className="flex items-center text-xl font-semibold text-text-primary">
                  <Settings className="w-5 h-5 mr-2 text-apple-blue" />
                  技术规格
                </h3>
                {expandedSections.technical ? 
                  <ChevronUp className="w-5 h-5 text-apple-blue" /> : 
                  <ChevronDown className="w-5 h-5 text-apple-blue" />
                }
              </button>
              
              {expandedSections.technical && (
                <div className="px-6 pb-6 transition-all duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.printing_method && (
                      <div className="bg-apple-blue-100 border border-apple-blue-200 p-4 rounded-lg">
                        <dt className="font-medium text-apple-blue-800 mb-1">印刷方式</dt>
                        <dd className="text-apple-blue-700">{product.printing_method}</dd>
                      </div>
                    )}
                    {product.post_processing && (
                      <div className="bg-apple-blue-100 border border-apple-blue-200 p-4 rounded-lg">
                        <dt className="font-medium text-apple-blue-800 mb-1">后道工艺</dt>
                        <dd className="text-apple-blue-700">{product.post_processing}</dd>
                      </div>
                    )}
                    {product.accessories && (
                      <div className="bg-apple-blue-200 border border-apple-blue-300 p-4 rounded-lg">
                        <dt className="font-medium text-apple-blue-800 mb-1">产品配件</dt>
                        <dd className="text-apple-blue-700">{product.accessories}</dd>
                      </div>
                    )}
                    {product.customization_area && (
                      <div className="bg-apple-blue-200 border border-apple-blue-300 p-4 rounded-lg">
                        <dt className="font-medium text-apple-blue-800 mb-1">定制区域</dt>
                        <dd className="text-apple-blue-700">{product.customization_area}</dd>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pricing and Business Information */}
            <div className="bg-apple-white rounded-xl shadow-sm border border-border-light overflow-hidden">
              <button 
                onClick={() => toggleSection('pricing')}
                className="w-full flex items-center justify-between p-6 hover:bg-apple-blue-100 transition-colors"
              >
                <h3 className="flex items-center text-xl font-semibold text-text-primary">
                  <DollarSign className="w-5 h-5 mr-2 text-apple-blue" />
                  价格与商务信息
                </h3>
                {expandedSections.pricing ? 
                  <ChevronUp className="w-5 h-5 text-apple-blue" /> : 
                  <ChevronDown className="w-5 h-5 text-apple-blue" />
                }
              </button>
              
              {expandedSections.pricing && (
                <div className="px-6 pb-6 transition-all duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.pricing_format && (
                      <div className="bg-apple-blue-300 border border-apple-blue-400 p-4 rounded-lg">
                        <dt className="font-medium text-apple-blue-900 mb-1">产品报价形式</dt>
                        <dd className="text-apple-blue-800">{product.pricing_format}</dd>
                      </div>
                    )}
                    {product.design_order && (
                      <div className="bg-apple-blue-300 border border-apple-blue-400 p-4 rounded-lg">
                        <dt className="font-medium text-apple-blue-900 mb-1">设计发单</dt>
                        <dd className="text-apple-blue-800">{product.design_order}</dd>
                      </div>
                    )}
                    {product.note_format && (
                      <div className="bg-apple-blue-400 border border-apple-blue-500 p-4 rounded-lg">
                        <dt className="font-medium text-apple-white mb-1">备注格式</dt>
                        <dd className="text-apple-blue-100">{product.note_format}</dd>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logistics Information */}
            <div className="bg-apple-white rounded-xl shadow-sm border border-border-light overflow-hidden">
              <button 
                onClick={() => toggleSection('logistics')}
                className="w-full flex items-center justify-between p-6 hover:bg-apple-blue-100 transition-colors"
              >
                <h3 className="flex items-center text-xl font-semibold text-text-primary">
                  <Truck className="w-5 h-5 mr-2 text-apple-blue" />
                  物流信息
                </h3>
                {expandedSections.logistics ? 
                  <ChevronUp className="w-5 h-5 text-apple-blue" /> : 
                  <ChevronDown className="w-5 h-5 text-apple-blue" />
                }
              </button>
              
              {expandedSections.logistics && (
                <div className="px-6 pb-6 transition-all duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.packaging_method && (
                      <div className="bg-apple-blue-200 border border-apple-blue-300 p-4 rounded-lg">
                        <dt className="font-medium text-apple-blue-800 mb-1">商品包装方式</dt>
                        <dd className="text-apple-blue-700">{product.packaging_method}</dd>
                      </div>
                    )}
                    {product.delivery_time && (
                      <div className="bg-apple-blue-300 border border-apple-blue-400 p-4 rounded-lg">
                        <dt className="font-medium text-apple-blue-900 mb-1">发货时效</dt>
                        <dd className="text-apple-blue-800">{product.delivery_time}</dd>
                      </div>
                    )}
                    {product.shipping_location_outsource && (
                      <div className="bg-apple-blue-100 border border-apple-blue-200 p-4 rounded-lg md:col-span-2">
                        <dt className="font-medium text-apple-blue-800 mb-1">发货地以及是否外协</dt>
                        <dd className="text-apple-blue-700">{product.shipping_location_outsource}</dd>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Product Features & Usage */}
            <div className="bg-apple-white rounded-xl shadow-sm border border-border-light overflow-hidden">
              <button 
                onClick={() => toggleSection('features')}
                className="w-full flex items-center justify-between p-6 hover:bg-apple-blue-100 transition-colors"
              >
                <h3 className="flex items-center text-xl font-semibold text-text-primary">
                  <Star className="w-5 h-5 mr-2 text-apple-blue" />
                  产品特色与使用
                </h3>
                {expandedSections.features ? 
                  <ChevronUp className="w-5 h-5 text-apple-blue" /> : 
                  <ChevronDown className="w-5 h-5 text-apple-blue" />
                }
              </button>
              
              {expandedSections.features && (
                <div className="px-6 pb-6 transition-all duration-300">
                  <div className="space-y-4">
                    {product.positioning_usage && (
                      <div className="bg-apple-blue-200 border border-apple-blue-300 p-4 rounded-lg">
                        <dt className="font-medium text-apple-blue-800 mb-2">产品定位/使用场景</dt>
                        <dd className="text-apple-blue-700">{product.positioning_usage}</dd>
                      </div>
                    )}
                    {product.selling_points && (
                      <div className="bg-apple-blue-300 border border-apple-blue-400 p-4 rounded-lg">
                        <dt className="font-medium text-apple-blue-900 mb-2">产品卖点</dt>
                        <dd className="text-apple-blue-800">{product.selling_points}</dd>
                      </div>
                    )}
                    {product.production_process && (
                      <div className="bg-apple-blue-400 border border-apple-blue-500 p-4 rounded-lg">
                        <dt className="font-medium text-apple-white mb-2">生产工艺</dt>
                        <dd className="text-apple-blue-100">{product.production_process}</dd>
                      </div>
                    )}
                    {product.application_scenarios && (
                      <div className="bg-apple-blue-400 border border-apple-blue-500 p-4 rounded-lg">
                        <dt className="font-medium text-apple-white mb-2">应用场景</dt>
                        <dd className="text-apple-blue-100">{product.application_scenarios}</dd>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-apple-white rounded-xl shadow-sm border border-border-light p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">快速操作</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-apple-blue text-white hover:bg-apple-blue-dark rounded-lg font-medium transition-colors">
                  <Download className="w-4 h-4" />
                  <span>下载资料</span>
                </button>
              </div>
            </div>

            {/* Product Attributes */}
            <div className="bg-apple-white rounded-xl shadow-sm border border-border-light p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">产品属性</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">支持定制</span>
                  <span className={`flex items-center px-3 py-1 text-sm font-medium rounded-full ${
                    product.is_customizable 
                      ? 'bg-apple-success text-white border border-apple-success' 
                      : 'bg-apple-gray text-text-tertiary border border-border-light'
                  }`}>
                    {product.is_customizable ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {product.is_customizable ? '是' : '否'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">支持特殊尺寸和数量</span>
                  <span className={`flex items-center px-3 py-1 text-sm font-medium rounded-full ${
                    product.supports_custom_specs 
                      ? 'bg-apple-success text-white border border-apple-success' 
                      : 'bg-apple-gray text-text-tertiary border border-border-light'
                  }`}>
                    {product.supports_custom_specs ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {product.supports_custom_specs ? '是' : '否'}
                  </span>
                </div>
        
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">有实物样品</span>
                  <span className={`flex items-center px-3 py-1 text-sm font-medium rounded-full ${
                    product.has_physical_sample 
                      ? 'bg-apple-success text-white border border-apple-success' 
                      : 'bg-apple-gray text-text-tertiary border border-border-light'
                  }`}>
                    {product.has_physical_sample ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {product.has_physical_sample ? '是' : '否'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">支持看样</span>
                  <span className={`flex items-center px-3 py-1 text-sm font-medium rounded-full ${
                    product.supports_sample_viewing 
                      ? 'bg-apple-success text-white border border-apple-success' 
                      : 'bg-apple-gray text-text-tertiary border border-border-light'
                  }`}>
                    {product.supports_sample_viewing ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {product.supports_sample_viewing ? '是' : '否'}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {product.customer_service_scripts && (
              <div className="bg-apple-white rounded-xl shadow-sm border border-border-light p-6">
                <h3 className="flex items-center text-lg font-semibold text-text-primary mb-4">
                  <Info className="w-4 h-4 mr-2 text-apple-blue" />
                  客服文案
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">{product.customer_service_scripts}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail