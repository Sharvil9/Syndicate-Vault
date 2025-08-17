import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api/middleware"
import { errorResponse, successResponse } from "@/lib/api/response"
import {
  validateFileContent,
  scanForViruses,
  generateSecureFileName,
  validateFileSize,
  sanitizeFileName,
} from "@/lib/utils/security"

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
]

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const supabase = createClient()
    const formData = await request.formData()
    const file = formData.get("file") as File
    const itemId = formData.get("item_id") as string
    const spaceId = formData.get("space_id") as string

    if (!file) {
      return NextResponse.json(errorResponse("No file provided"), { status: 400 })
    }

    const sizeValidation = validateFileSize(file.size, file.type)
    if (!sizeValidation.valid) {
      return NextResponse.json(
        errorResponse(
          `File too large. Maximum size for ${file.type} is ${Math.round(sizeValidation.maxSize / 1024 / 1024)}MB.`,
        ),
        { status: 400 },
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(errorResponse("File type not allowed"), { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    if (!validateFileContent(buffer, file.type)) {
      return NextResponse.json(errorResponse("File content doesn't match declared type"), { status: 400 })
    }

    const isClean = await scanForViruses(buffer)
    if (!isClean) {
      return NextResponse.json(errorResponse("File contains suspicious content"), { status: 400 })
    }

    // Check space access if provided
    if (spaceId) {
      const { data: space } = await supabase
        .from("spaces")
        .select("*")
        .eq("id", spaceId)
        .is("deleted_at", null)
        .single()

      if (!space) {
        return NextResponse.json(errorResponse("Space not found"), { status: 404 })
      }

      if (space.type === "personal" && space.owner_id !== user.id) {
        return NextResponse.json(errorResponse("Access denied"), { status: 403 })
      }
    }

    const sanitizedOriginalName = sanitizeFileName(file.name)
    const secureFilename = generateSecureFileName(sanitizedOriginalName, user.id)
    const storagePath = `uploads/${user.id}/${secureFilename}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("vault-files")
      .upload(storagePath, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(errorResponse("Failed to upload file"), { status: 500 })
    }

    // Create attachment record if item_id provided
    let attachment = null
    if (itemId) {
      const { data: attachmentData, error: attachmentError } = await supabase
        .from("attachments")
        .insert({
          item_id: itemId,
          filename: secureFilename,
          original_filename: sanitizedOriginalName,
          mime_type: file.type,
          file_size: file.size,
          storage_path: storagePath,
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (attachmentError) {
        console.error("Attachment creation error:", attachmentError)
        // Clean up uploaded file
        await supabase.storage.from("vault-files").remove([storagePath])
        return NextResponse.json(errorResponse("Failed to create attachment record"), { status: 500 })
      }

      attachment = attachmentData
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("vault-files").getPublicUrl(storagePath)

    await supabase.from("activity_log").insert({
      user_id: user.id,
      action: "file_upload",
      resource_type: "attachment",
      resource_id: attachment?.id,
      details: {
        original_filename: sanitizedOriginalName,
        secure_filename: secureFilename,
        size: file.size,
        type: file.type,
        item_id: itemId,
        space_id: spaceId,
      },
      ip_address: request.headers.get("x-forwarded-for") || "127.0.0.1",
      user_agent: request.headers.get("user-agent"),
    })

    return NextResponse.json(
      successResponse(
        {
          attachment,
          file: {
            filename: secureFilename,
            original_filename: sanitizedOriginalName,
            mime_type: file.type,
            file_size: file.size,
            storage_path: storagePath,
            public_url: urlData.publicUrl,
          },
        },
        "File uploaded successfully",
      ),
    )
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(errorResponse("Internal server error"), { status: 500 })
  }
})
