export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    total?: number
    offset?: number
    limit?: number
    hasMore?: boolean
  }
}

export function successResponse<T>(data: T, message?: string, meta?: any): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    meta,
  }
}

export function errorResponse(error: string, statusCode?: number): ApiResponse {
  return {
    success: false,
    error,
  }
}

export function validationErrorResponse(errors: any[]): ApiResponse {
  return {
    success: false,
    error: "Validation failed",
    data: { errors },
  }
}
