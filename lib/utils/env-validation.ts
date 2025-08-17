import { z } from "zod"

const envSchema = z.object({
  // Database
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),

  // Redis/Upstash
  KV_REST_API_URL: z.string().url("Invalid KV REST API URL"),
  KV_REST_API_TOKEN: z.string().min(1, "KV REST API token is required"),

  // Application
  NEXT_PUBLIC_SITE_URL: z.string().url("Invalid site URL").optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // Security
  NEXTAUTH_SECRET: z.string().min(32, "NextAuth secret must be at least 32 characters").optional(),
  CSRF_SECRET: z.string().min(32, "CSRF secret must be at least 32 characters").optional(),
})

export type Environment = z.infer<typeof envSchema>

export function validateEnvironment(): Environment {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("\n")
      throw new Error(`Environment validation failed:\n${missingVars}`)
    }
    throw error
  }
}

export function getRequiredEnvVars(): string[] {
  return [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "KV_REST_API_URL",
    "KV_REST_API_TOKEN",
  ]
}

export function checkEnvironment(): { valid: boolean; missing: string[]; errors: string[] } {
  const missing: string[] = []
  const errors: string[] = []

  try {
    validateEnvironment()
    return { valid: true, missing: [], errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      for (const err of error.errors) {
        const path = err.path.join(".")
        if (err.code === "invalid_type" && err.received === "undefined") {
          missing.push(path)
        } else {
          errors.push(`${path}: ${err.message}`)
        }
      }
    } else {
      errors.push(error instanceof Error ? error.message : "Unknown error")
    }

    return { valid: false, missing, errors }
  }
}
