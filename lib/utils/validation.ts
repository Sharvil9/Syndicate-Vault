import { z } from "zod"

// Common validation schemas
export const uuidSchema = z.string().uuid("Invalid UUID format")
export const emailSchema = z.string().email("Invalid email format")
export const urlSchema = z.string().url("Invalid URL format")

// Pagination validation
export const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
})

// Search validation
export const searchSchema = z.object({
  query: z.string().min(1).max(200).optional(),
  type: z.enum(["bookmark", "note", "file", "snippet"]).optional(),
  space_id: uuidSchema.optional(),
  category_id: uuidSchema.optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  is_favorite: z.boolean().optional(),
  sort_by: z.enum(["created_at", "updated_at", "title", "relevance"]).default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
})

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  item_id: uuidSchema.optional(),
  space_id: uuidSchema.optional(),
})

// Validation error formatter
export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {}

  error.errors.forEach((err) => {
    const path = err.path.join(".")
    if (!errors[path]) {
      errors[path] = []
    }
    errors[path].push(err.message)
  })

  return errors
}

// Sanitization utilities
export function sanitizeString(input: string, maxLength = 1000): string {
  return input.trim().substring(0, maxLength)
}

export function sanitizeTags(tags: string[]): string[] {
  return tags
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0 && tag.length <= 50)
    .slice(0, 20)
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/javascript:/gi, "")
}
