import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/api/middleware"
import { successResponse } from "@/lib/api/response"
import { logger } from "@/lib/utils/logger"
import { PerformanceMonitor } from "@/lib/utils/performance"

export const GET = withAdminAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get("level")
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 100

    // Get logs
    const logs = logger.getLogs(level ? Number.parseInt(level) : undefined, limit)

    // Get performance metrics
    const performanceMetrics = PerformanceMonitor.getAllMetrics()

    // System metrics
    const systemMetrics = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    }

    const metrics = {
      logs: logs.slice(-50), // Last 50 logs
      performance: performanceMetrics,
      system: systemMetrics,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(successResponse(metrics, "Metrics retrieved successfully"))
  } catch (error) {
    logger.error("Failed to retrieve metrics", { error: error instanceof Error ? error.message : "Unknown error" })
    return NextResponse.json({ error: "Failed to retrieve metrics" }, { status: 500 })
  }
})
