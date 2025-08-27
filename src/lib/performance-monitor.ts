/**
 * 性能监控工具
 */

interface PerformanceMetrics {
  name: string
  duration: number
  timestamp: number
  url?: string
  userAgent?: string
}

interface ErrorInfo {
  message: string
  stack?: string
  url?: string
  line?: number
  column?: number
  timestamp: number
  userAgent?: string
  userId?: string
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics[] = []
  private errors: ErrorInfo[] = []
  private isEnabled: boolean

  constructor() {
    this.isEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
    this.setupErrorHandling()
    this.setupPerformanceObserver()
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private setupErrorHandling() {
    if (!this.isEnabled) return

    // 全局错误处理
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
    })

    // Promise 错误处理
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
    })
  }

  private setupPerformanceObserver() {
    if (!this.isEnabled || !('PerformanceObserver' in window)) return

    try {
      // 监控页面加载性能
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.logMetric({
              name: 'page_load',
              duration: entry.duration,
              timestamp: Date.now(),
              url: window.location.href
            })
          } else if (entry.entryType === 'paint') {
            this.logMetric({
              name: entry.name,
              duration: entry.startTime,
              timestamp: Date.now(),
              url: window.location.href
            })
          }
        }
      })

      observer.observe({ entryTypes: ['navigation', 'paint'] })
    } catch (error) {
      console.warn('Performance Observer not supported:', error)
    }
  }

  logMetric(metric: Omit<PerformanceMetrics, 'userAgent'>) {
    if (!this.isEnabled) return

    const fullMetric: PerformanceMetrics = {
      ...metric,
      userAgent: navigator.userAgent
    }

    this.metrics.push(fullMetric)
    
    // 保持最近 100 条记录
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }

    if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
      console.log('Performance Metric:', fullMetric)
    }
  }

  logError(error: ErrorInfo) {
    if (!this.isEnabled) return

    this.errors.push(error)
    
    // 保持最近 50 条错误记录
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50)
    }

    console.error('Application Error:', error)
  }

  // 记录自定义性能指标
  measureTime<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start

    this.logMetric({
      name: `custom_${name}`,
      duration,
      timestamp: Date.now(),
      url: window.location.href
    })

    return result
  }

  // 记录异步操作性能
  async measureAsyncTime<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      
      this.logMetric({
        name: `async_${name}`,
        duration,
        timestamp: Date.now(),
        url: window.location.href
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      
      this.logError({
        message: `Error in ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
      
      this.logMetric({
        name: `async_${name}_error`,
        duration,
        timestamp: Date.now(),
        url: window.location.href
      })
      
      throw error
    }
  }

  // 获取性能报告
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  getErrors(): ErrorInfo[] {
    return [...this.errors]
  }

  // 清空记录
  clear() {
    this.metrics = []
    this.errors = []
  }
}

export default PerformanceMonitor.getInstance()