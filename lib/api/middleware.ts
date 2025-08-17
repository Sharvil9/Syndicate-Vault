import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { errorResponse } from "./response"
import { ratelimit } from "@/lib/ratelimit"
import { logger } from "@/lib/utils/logger"
import { ErrorHandler, AppError } from "@/lib/utils/error-handler"
import { v4 as uuidv4 } from "uuid"

function validateCSRFToken(request: NextRequest): boolean {
  const token = request.headers.get("x-csrf-token")
  const cookie = request.cookies.get("csrf-token")?.value
  return token === cookie && token !== null
}

export async function withAuth(handler: (request: NextRequest, user: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const requestId = uuidv4()
    const startTime = Date.now()

    try {
      // Add request ID to headers
      request.headers.set("x-request-id", requestId)

      // Rate limiting
      const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
      const { success } = await ratelimit.limit(ip)

      if (!success) {
        throw new AppError("Too many requests", "RATE_LIMIT_ERROR", 429)
      }

      // CSRF protection for state-changing operations
      if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
        if (!validateCSRFToken(request)) {
          throw new AppError("Invalid CSRF token", "AUTHENTICATION_ERROR", 403)
        }
      }

      const supabase = createClient()
      if (!supabase) {
        throw new AppError("Database connection failed", "DATABASE_ERROR", 500)
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        throw new AppError("Unauthorized", "AUTHENTICATION_ERROR", 401)
      }

      const { data: userProfile } = await supabase.from("users").select("status, role").eq("id", user.id).single()

      if (!userProfile || userProfile.status !== "approved") {
        throw new AppError("Account pending approval", "AUTHORIZATION_ERROR", 403)
      }

      // Log request
      logger.info("API request", {
        method: request.method,
        url: request.url,
        userId: user.id,
        userRole: userProfile.role,
        ip,
        userAgent: request.headers.get("user-agent"),
        requestId,
      })

      const response = await handler(request, { ...user, ...userProfile })

      // Log response
      const duration = Date.now() - startTime
      logger.info("API response", {
        status: response.status,
        duration,
        requestId,
        userId: user.id,
      })

      // Add response headers
      response.headers.set("X-Request-ID", requestId)
      response.headers.set("X-Response-Time", `${duration}ms`)

      return response
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error("API error", {
        method: request.method,
        url: request.url,
        duration,
        requestId,
        error: error instanceof Error ? error.message : "Unknown error",
      })

      return ErrorHandler.handle(error, requestId, request.headers.get("x-user-id") || undefined)
    }
  }
}

export async function withAdminAuth(handler: (request: NextRequest, user: any) => Promise<NextResponse>) {
  return withAuth(async (request: NextRequest, user: any) => {
    if (user.role !== "admin") {
      throw new AppError("Admin access required", "AUTHORIZATION_ERROR", 403)
    }
    return await handler(request, user)
  })
}

export async function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limit = 10,
  window = "1 m",
) {
  return async (request: NextRequest) => {
    try {
      const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
      const identifier = `rate_limit:${ip}:${request.nextUrl.pathname}`

      const { success, remaining, reset } = await ratelimit.limit(identifier)

      if (!success) {
        return NextResponse.json(
          errorResponse(`Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds`),
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            },
          },
        )
      }

      const response = await handler(request)

      // Add rate limit headers to successful responses
      response.headers.set("X-RateLimit-Limit", limit.toString())
      response.headers.set("X-RateLimit-Remaining", remaining.toString())
      response.headers.set("X-RateLimit-Reset", reset.toString())

      return response
    } catch (error) {
      console.error("Rate limit middleware error:", error)
      return await handler(request) // Fallback to no rate limiting
    }
  }
}

export async function withTransaction<T>(
  operation: (supabase: any) => Promise<T>,
): Promise<{ data: T | null; error: string | null }> {
  const supabase = createClient()

  try {
    // Begin transaction
    const { data, error } = await supabase.rpc("begin_transaction")
    if (error) throw error

    try {
      const result = await operation(supabase)

      // Commit transaction
      await supabase.rpc("commit_transaction")
      return { data: result, error: null }
    } catch (operationError) {
      // Rollback transaction
      await supabase.rpc("rollback_transaction")
      throw operationError
    }
  } catch (error) {
    console.error("Transaction error:", error)
    return { data: null, error: error instanceof Error ? error.message : "Transaction failed" }
  }
}

export function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    // Remove potentially dangerous characters and scripts
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .trim()
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }

  if (typeof input === "object" && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }

  return input
}
