import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
}

export class CacheManager {
  private static instance: CacheManager
  private defaultTTL = 300 // 5 minutes

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key)
      return cached as T
    } catch (error) {
      console.error("Cache get error:", error)
      return null
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || this.defaultTTL
      await redis.setex(key, ttl, JSON.stringify(value))

      // Store cache tags for invalidation
      if (options.tags) {
        for (const tag of options.tags) {
          await redis.sadd(`tag:${tag}`, key)
          await redis.expire(`tag:${tag}`, ttl)
        }
      }
    } catch (error) {
      console.error("Cache set error:", error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error("Cache delete error:", error)
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      const keys = await redis.smembers(`tag:${tag}`)
      if (keys.length > 0) {
        await redis.del(...keys)
        await redis.del(`tag:${tag}`)
      }
    } catch (error) {
      console.error("Cache invalidation error:", error)
    }
  }

  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = params[key]
          return result
        },
        {} as Record<string, any>,
      )

    return `${prefix}:${Buffer.from(JSON.stringify(sortedParams)).toString("base64")}`
  }
}

export const cache = CacheManager.getInstance()

// Cache decorators
export function cached(ttl = 300, tags: string[] = []) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = cache.generateKey(`${target.constructor.name}.${propertyName}`, { args })

      let result = await cache.get(cacheKey)
      if (result !== null) {
        return result
      }

      result = await method.apply(this, args)
      await cache.set(cacheKey, result, { ttl, tags })

      return result
    }

    return descriptor
  }
}
