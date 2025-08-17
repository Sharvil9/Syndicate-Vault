"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, X, File, Image, Video, Music, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  itemId?: string
  spaceId?: string
  onUploadComplete?: (file: any) => void
  className?: string
}

export default function FileUpload({ itemId, spaceId, onUploadComplete, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-8 w-8" />
    if (type.startsWith("video/")) return <Video className="h-8 w-8" />
    if (type.startsWith("audio/")) return <Music className="h-8 w-8" />
    if (type === "application/pdf") return <FileText className="h-8 w-8" />
    return <File className="h-8 w-8" />
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (itemId) formData.append("item_id", itemId)
      if (spaceId) formData.append("space_id", spaceId)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (response.ok) {
        onUploadComplete?.(result)
        setTimeout(() => {
          setUploading(false)
          setUploadProgress(0)
        }, 1000)
      } else {
        throw new Error(result.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      setError(error instanceof Error ? error.message : "Upload failed")
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Card className={cn("bg-slate-800/50 backdrop-blur-sm border-slate-700", className)}>
      <CardContent className="p-6">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging ? "border-purple-500 bg-purple-500/10" : "border-slate-600",
            uploading && "pointer-events-none opacity-50",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />

          {uploading ? (
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-purple-400 mx-auto animate-pulse" />
              <div>
                <p className="text-white font-medium">Uploading...</p>
                <Progress value={uploadProgress} className="mt-2" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-slate-400 mx-auto" />
              <div>
                <p className="text-white font-medium mb-2">Drop files here or click to browse</p>
                <p className="text-sm text-slate-400">Supports images, videos, audio, PDFs, and documents up to 50MB</p>
              </div>
              <Button onClick={() => fileInputRef.current?.click()} className="bg-purple-600 hover:bg-purple-700">
                Choose Files
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center justify-between">
            <p className="text-red-400 text-sm">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
