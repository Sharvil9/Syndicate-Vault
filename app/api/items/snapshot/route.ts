import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import DOMPurify from "isomorphic-dompurify"

const snapshotSchema = z.object({
  url: z.string().url(),
  html: z.string(),
  title: z.string().optional(),
  excerpt: z.string().optional(),
  space_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
})

// Sanitize HTML content
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
      "code",
      "pre",
      "div",
      "span",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class"],
    ALLOW_DATA_ATTR: false,
  })
}

// Extract metadata from HTML
function extractMetadata(html: string, url: string) {
  // Simple regex-based extraction (in production, use a proper HTML parser)
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
  const ogDescriptionMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)

  const title = ogTitleMatch?.[1] || titleMatch?.[1] || new URL(url).hostname
  const description = ogDescriptionMatch?.[1] || descriptionMatch?.[1] || ""

  return {
    title: title.trim(),
    excerpt: description.trim().substring(0, 300),
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = snapshotSchema.parse(body)

    // Sanitize HTML
    const sanitizedHtml = sanitizeHtml(validatedData.html)

    // Extract metadata if not provided
    const metadata = extractMetadata(validatedData.html, validatedData.url)
    const title = validatedData.title || metadata.title
    const excerpt = validatedData.excerpt || metadata.excerpt

    // Check space access
    const { data: space } = await supabase.from("spaces").select("*").eq("id", validatedData.space_id).single()

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 })
    }

    if (space.type === "personal" && space.owner_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Create item with HTML snapshot
    const itemData = {
      title,
      content: excerpt,
      url: validatedData.url,
      html_snapshot: sanitizedHtml,
      excerpt,
      type: "bookmark" as const,
      tags: validatedData.tags,
      category_id: validatedData.category_id,
      space_id: validatedData.space_id,
      created_by: user.id,
    }

    // For common spaces, create edit request if user is not admin
    if (space.type === "common") {
      const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (userProfile?.role !== "admin") {
        const { data: editRequest, error: editError } = await supabase
          .from("edit_requests")
          .insert({
            item_id: null,
            requested_by: user.id,
            title,
            content: excerpt,
            tags: validatedData.tags,
            reason: "Web content capture",
          })
          .select()
          .single()

        if (editError) {
          return NextResponse.json({ error: "Failed to create edit request" }, { status: 500 })
        }

        return NextResponse.json({ editRequest, message: "Content saved as edit request for admin approval" })
      }
    }

    const { data: item, error } = await supabase.from("items").insert(itemData).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: user.id,
      action: "create",
      resource_type: "item",
      resource_id: item.id,
      details: { title: item.title, url: item.url, type: "web_capture" },
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Snapshot creation error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
