import { createClient } from "@/lib/supabase/server"
import { cache } from "./cache"

export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()

  static startTimer(operation: string): () => number {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.recordMetric(operation, duration)
      return duration
    }
  }

  static recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }

    const metrics = this.metrics.get(operation)!
    metrics.push(duration)

    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift()
    }
  }

  static getMetrics(operation: string): { avg: number; min: number; max: number; count: number } {
    const metrics = this.metrics.get(operation) || []
    if (metrics.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 }
    }

    const sum = metrics.reduce((a, b) => a + b, 0)
    return {
      avg: sum / metrics.length,
      min: Math.min(...metrics),
      max: Math.max(...metrics),
      count: metrics.length,
    }
  }

  static getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [operation, metrics] of this.metrics.entries()) {
      result[operation] = this.getMetrics(operation)
    }
    return result
  }
}

export async function withPerformanceMonitoring<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const endTimer = PerformanceMonitor.startTimer(operation)
  try {
    const result = await fn()
    return result
  } finally {
    endTimer()
  }
}

// Connection pool for Supabase
export class ConnectionPool {
  private static instance: ConnectionPool
  private clients: Map<string, any> = new Map()
  private maxConnections = 10
  private connectionCount = 0

  static getInstance(): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool()
    }
    return ConnectionPool.instance
  }

  async getClient(userId?: string): Promise<any> {
    const key = userId || "default"

    if (this.clients.has(key)) {
      return this.clients.get(key)
    }

    if (this.connectionCount >= this.maxConnections) {
      // Return existing client if pool is full
      return Array.from(this.clients.values())[0]
    }

    const client = createClient()
    this.clients.set(key, client)
    this.connectionCount++

    return client
  }

  releaseClient(userId?: string): void {
    const key = userId || "default"
    if (this.clients.has(key)) {
      this.clients.delete(key)
      this.connectionCount--
    }
  }

  getStats(): { activeConnections: number; maxConnections: number } {
    return {
      activeConnections: this.connectionCount,
      maxConnections: this.maxConnections,
    }
  }
}

export const connectionPool = ConnectionPool.getInstance()

// Query optimization utilities
export class QueryOptimizer {
  static buildOptimizedQuery(
    supabase: any,
    table: string,
    options: {
      select?: string
      filters?: Record<string, any>
      joins?: Array<{ table: string; on: string; select?: string }>
      orderBy?: { column: string; ascending?: boolean }
      limit?: number
      offset?: number
    },
  ) {
    let query = supabase.from(table)

    // Use specific select to avoid over-fetching
    if (options.select) {
      query = query.select(options.select)
    }

    // Apply filters efficiently
    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (Array.isArray(value)) {
          query = query.in(key, value)
        } else if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      }
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? false,
      })
    }

    // Apply pagination
    if (options.limit) {
      const start = options.offset || 0
      query = query.range(start, start + options.limit - 1)
    }

    return query
  }

  static async executeWithCache<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl = 300,
    tags: string[] = [],
  ): Promise<T> {
    // Try cache first
    const cached = await cache.get<T>(cacheKey)
    if (cached !== null) {
      return cached
    }

    // Execute query with performance monitoring
    const result = await withPerformanceMonitoring(`query:${cacheKey}`, queryFn)

    // Cache result
    await cache.set(cacheKey, result, { ttl, tags })

    return result
  }
}
