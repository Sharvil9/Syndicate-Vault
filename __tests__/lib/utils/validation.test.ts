import { describe, it, expect } from "@jest/globals"
import { sanitizeString, sanitizeTags, formatValidationErrors } from "@/lib/utils/validation"
import { z } from "zod"

describe("Validation Utils", () => {
  describe("sanitizeString", () => {
    it("should trim whitespace", () => {
      expect(sanitizeString("  hello world  ")).toBe("hello world")
    })

    it("should limit string length", () => {
      const longString = "a".repeat(2000)
      expect(sanitizeString(longString, 100)).toHaveLength(100)
    })
  })

  describe("sanitizeTags", () => {
    it("should normalize tags", () => {
      const tags = ["  JavaScript  ", "REACT", "next.js", ""]
      const result = sanitizeTags(tags)
      expect(result).toEqual(["javascript", "react", "next.js"])
    })

    it("should limit number of tags", () => {
      const tags = Array.from({ length: 30 }, (_, i) => `tag${i}`)
      const result = sanitizeTags(tags)
      expect(result).toHaveLength(20)
    })
  })

  describe("formatValidationErrors", () => {
    it("should format Zod errors correctly", () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      })

      try {
        schema.parse({ email: "invalid", age: 15 })
      } catch (error) {
        const formatted = formatValidationErrors(error as z.ZodError)
        expect(formatted).toHaveProperty("email")
        expect(formatted).toHaveProperty("age")
      }
    })
  })
})
