import crypto from "crypto"

export function validateFileContent(buffer: Buffer, expectedMimeType: string): boolean {
  const signatures: Record<string, string[]> = {
    "image/jpeg": ["FFD8FF"],
    "image/png": ["89504E47"],
    "image/gif": ["474946"],
    "application/pdf": ["25504446"],
    "text/plain": [], // No signature needed
    "video/mp4": ["66747970"],
    "audio/mpeg": ["494433", "FFFB"],
    "image/webp": ["52494646"],
    "audio/wav": ["52494646"],
    "audio/ogg": ["4F676753"],
  }

  if (!signatures[expectedMimeType]) {
    return false
  }

  if (signatures[expectedMimeType].length === 0) {
    return true // No signature validation needed
  }

  const header = buffer.subarray(0, 8).toString("hex").toUpperCase()
  return signatures[expectedMimeType].some((sig) => header.startsWith(sig))
}

export async function scanForViruses(buffer: Buffer): Promise<boolean> {
  // Check for suspicious patterns
  const suspicious = [
    "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*", // EICAR test
    "eval(", // JavaScript eval
    "exec(", // Code execution
    "<script", // Script tags
    "javascript:", // JavaScript protocol
    "vbscript:", // VBScript protocol
  ]

  const content = buffer.toString("ascii").toLowerCase()
  const isClean = !suspicious.some((pattern) => content.includes(pattern.toLowerCase()))

  // Additional checks for executable file headers
  const header = buffer.subarray(0, 4).toString("hex").toUpperCase()
  const executableHeaders = ["4D5A", "7F454C46", "CAFEBABE", "FEEDFACE"]
  const hasExecutableHeader = executableHeaders.some((sig) => header.startsWith(sig))

  return isClean && !hasExecutableHeader
}

export function generateSecureFileName(originalName: string, userId: string): string {
  const extension = originalName.split(".").pop()?.toLowerCase()
  const timestamp = Date.now()
  const random = crypto.randomBytes(16).toString("hex")
  const hash = crypto.createHash("sha256").update(`${userId}${timestamp}${random}`).digest("hex").substring(0, 16)

  return `${timestamp}_${hash}.${extension}`
}

export function getCSPHeaders(): Record<string, string> {
  return {
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  }
}

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

export function validateFileSize(size: number, mimeType: string): { valid: boolean; maxSize: number } {
  const limits: Record<string, number> = {
    "image/jpeg": 10 * 1024 * 1024, // 10MB
    "image/png": 10 * 1024 * 1024, // 10MB
    "image/gif": 5 * 1024 * 1024, // 5MB
    "image/webp": 10 * 1024 * 1024, // 10MB
    "application/pdf": 25 * 1024 * 1024, // 25MB
    "text/plain": 1 * 1024 * 1024, // 1MB
    "application/msword": 25 * 1024 * 1024, // 25MB
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 25 * 1024 * 1024, // 25MB
    "video/mp4": 100 * 1024 * 1024, // 100MB
    "video/webm": 100 * 1024 * 1024, // 100MB
    "audio/mpeg": 50 * 1024 * 1024, // 50MB
    "audio/wav": 50 * 1024 * 1024, // 50MB
    "audio/ogg": 50 * 1024 * 1024, // 50MB
  }

  const maxSize = limits[mimeType] || 10 * 1024 * 1024 // Default 10MB
  return { valid: size <= maxSize, maxSize }
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace special chars with underscore
    .replace(/\.{2,}/g, ".") // Replace multiple dots with single dot
    .replace(/^\.+|\.+$/g, "") // Remove leading/trailing dots
    .substring(0, 255) // Limit length
}
