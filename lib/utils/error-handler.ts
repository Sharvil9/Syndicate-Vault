import { NextResponse } from "next/server"
import { logger } from "./logger"
import { errorResponse } from "@/lib/api/response"

export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, any>

  constructor(message: string, code: ErrorCode, statusCode = 500, isOperational = true, context?: Record<string, any>) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, true, context)
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required", context?: Record<string, any>) {
    super(message, ErrorCode.AUTHENTICATION_ERROR, 401, true, context)
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions", context?: Record<string, any>) {
    super(message, ErrorCode.AUTHORIZATION_ERROR, 403, true, context)
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", context?: Record<string, any>) {
    super(message, ErrorCode.NOT_FOUND_ERROR, 404, true, context)
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded", context?: Record<string, any>) {
    super(message, ErrorCode.RATE_LIMIT_ERROR, 429, true, context)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.DATABASE_ERROR, 500, true, context)
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.EXTERNAL_SERVICE_ERROR, 502, true, context)
  }
}

export class ErrorHandler {
  static handle(error: unknown, requestId?: string, userId?: string): NextResponse {
    let appError: AppError

    if (error instanceof AppError) {
      appError = error
    } else if (error instanceof Error) {
      appError = new AppError(error.message, ErrorCode.INTERNAL_SERVER_ERROR, 500, false, { originalError: error.name })
    } else {
      appError = new AppError("An unexpected error occurred", ErrorCode.INTERNAL_SERVER_ERROR, 500, false)
    }

    // Log the error
    logger.error(
      appError.message,
      {
        code: appError.code,
        statusCode: appError.statusCode,
        isOperational: appError.isOperational,
        context: appError.context,
        requestId,
        userId,
        stack: appError.stack,
      },
      appError,
    )

    // Don't expose internal errors in production
    const message =
      appError.isOperational || process.env.NODE_ENV === "development" ? appError.message : "Internal server error"

    return NextResponse.json(errorResponse(message, appError.statusCode), {
      status: appError.statusCode,
      headers: {
        "X-Request-ID": requestId || "unknown",
        "X-Error-Code": appError.code,
      },
    })
  }

  static async withErrorHandling<T>(operation: () => Promise<T>, context?: Record<string, any>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      // Convert known error types
      if (error instanceof Error) {
        if (error.message.includes("duplicate key")) {
          throw new ValidationError("Resource already exists", context)
        }
        if (error.message.includes("foreign key")) {
          throw new ValidationError("Invalid reference", context)
        }
        if (error.message.includes("not found")) {
          throw new NotFoundError("Resource not found", context)
        }
      }

      throw new AppError("Operation failed", ErrorCode.INTERNAL_SERVER_ERROR, 500, false, context)
    }
  }
}

export async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3, delay = 1000, backoff = 2): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on operational errors
      if (error instanceof AppError && error.isOperational) {
        throw error
      }

      if (attempt === maxRetries) {
        logger.error(`Operation failed after ${maxRetries} attempts`, {
          attempts: maxRetries,
          lastError: lastError.message,
        })
        throw lastError
      }

      const waitTime = delay * Math.pow(backoff, attempt - 1)
      logger.warn(`Operation failed, retrying in ${waitTime}ms`, {
        attempt,
        maxRetries,
        error: lastError.message,
      })

      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }
  }

  throw lastError!
}
