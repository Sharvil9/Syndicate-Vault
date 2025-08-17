import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/utils/logger"
import { PerformanceMonitor, connectionPool } from "@/lib/utils/performance"
import { cache } from "@/lib/utils/cache"

interface HealthCheck {
  service: string
  status: "healthy" | "unhealthy" | "degraded"
  responseTime?: number
  error?: string
  details?: Record<string, any>
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const checks: HealthCheck[] = []

  // Database health check
  try {
    const dbStart = Date.now()
    const supabase = createClient()
    const { data, error } = await supabase.from("users").select("count").limit(1).single()
    const dbTime = Date.now() - dbStart

    checks.push({
      service: "database",
      status: error ? "unhealthy" : "healthy",
      responseTime: dbTime,
      error: error?.message,
    })
  } catch (error) {
    checks.push({
      service: "database",
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // Cache health check
  try {
    const cacheStart = Date.now()
    await cache.set("health-check", { timestamp: Date.now() }, { ttl: 60 })
    const cached = await cache.get("health-check")
    const cacheTime = Date.now() - cacheStart

    checks.push({
      service: "cache",
      status: cached ? "healthy" : "unhealthy",
      responseTime: cacheTime,
    })
  } catch (error) {
    checks.push({
      service: "cache",
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // Connection pool health check
  try {
    const poolStats = connectionPool.getStats()
    checks.push({
      service: "connection_pool",
      status: poolStats.activeConnections < poolStats.maxConnections ? "healthy" : "degraded",
      details: poolStats,
    })
  } catch (error) {
    checks.push({
      service: "connection_pool",
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // Performance metrics
  const performanceMetrics = PerformanceMonitor.getAllMetrics()

  // Overall health status
  const overallStatus = checks.every((check) => check.status === "healthy")
    ? "healthy"
    : checks.some((check) => check.status === "unhealthy")
      ? "unhealthy"
      : "degraded"

  const totalTime = Date.now() - startTime

  const healthReport = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: totalTime,
    checks,
    performance: performanceMetrics,
    version: process.env.npm_package_version || "unknown",
    environment: process.env.NODE_ENV || "unknown",
  }

  // Log health check results
  logger.info("Health check completed", {
    status: overallStatus,
    responseTime: totalTime,
    checksCount: checks.length,
  })

  const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503

  return NextResponse.json(healthReport, { status: statusCode })
}
