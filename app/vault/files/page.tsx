"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Upload,
  Download,
  Trash2,
  Eye,
  Grid,
  List,
  SortAsc,
  SortDesc,
  File,
  ImageIcon,
  Video,
  Music,
  FileText,
  MoreHorizontal,
} from "lucide-react"
import FileUpload from "@/components/vault/file-upload"
import { formatDistanceToNow } from "date-fns"

interface FileItem {
  id: string
  filename: string
  original_filename: string
  mime_type: string
  file_size: number
  storage_path: string
  created_at: string
  item?: {
    id: string
    title: string
  }
  uploader?: {
    full_name: string
    email: string
  }
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const [filterType, setFilterType] = useState("all")
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [searchQuery, sortBy, sortOrder, filterType])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      if (searchQuery) params.append("search", searchQuery)
      if (filterType !== "all") params.append("type", filterType)

      const response = await fetch(`/api/files?${params}`)
      const data = await response.json()

      if (response.ok) {
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error("Failed to fetch files:", error)
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-6 w-6" />
    if (mimeType.startsWith("video/")) return <Video className="h-6 w-6" />
    if (mimeType.startsWith("audio/")) return <Music className="h-6 w-6" />
    if (mimeType === "application/pdf") return <FileText className="h-6 w-6" />
    return <File className="h-6 w-6" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]))
  }

  const handleSelectAll = () => {
    setSelectedFiles(selectedFiles.length === files.length ? [] : files.map((f) => f.id))
  }

  const handleDeleteSelected = async () => {
    if (selectedFiles.length === 0) return

    try {
      const response = await fetch("/api/files/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_ids: selectedFiles }),
      })

      if (response.ok) {
        setSelectedFiles([])
        fetchFiles()
      }
    } catch (error) {
      console.error("Failed to delete files:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">File Manager</h1>
          <p className="text-slate-400">Manage your uploaded files and attachments</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="bg-purple-600 hover:bg-purple-700">
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Upload Files</h2>
              <Button variant="ghost" onClick={() => setShowUpload(false)}>
                ×
              </Button>
            </div>
            <FileUpload
              onUploadComplete={() => {
                setShowUpload(false)
                fetchFiles()
              }}
            />
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-600 text-white"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48 bg-slate-900/50 border-slate-600">
                <SelectValue placeholder="All file types" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All file types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 bg-slate-900/50 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="created_at">Date</SelectItem>
                  <SelectItem value="filename">Name</SelectItem>
                  <SelectItem value="file_size">Size</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="border-slate-600"
              >
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="border-slate-600"
              >
                {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedFiles.length > 0 && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700">
              <span className="text-sm text-slate-400">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
              </span>
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Files Grid/List */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Files ({files.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedFiles.length === files.length && files.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-slate-400">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-slate-400 mt-2">Loading files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <File className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No files found</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map((file) => (
                <Card
                  key={file.id}
                  className="bg-slate-700/50 border-slate-600 hover:bg-slate-700/70 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedFiles.includes(file.id)}
                        onCheckedChange={() => handleSelectFile(file.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getFileIcon(file.mime_type)}
                          <span className="text-sm font-medium text-white truncate">{file.original_filename}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-1">{formatFileSize(file.file_size)}</p>
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                        </p>
                        {file.item && (
                          <Badge variant="secondary" className="text-xs mt-2">
                            {file.item.title}
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedFiles.includes(file.id)}
                    onCheckedChange={() => handleSelectFile(file.id)}
                  />
                  {getFileIcon(file.mime_type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{file.original_filename}</p>
                    <p className="text-sm text-slate-400">
                      {formatFileSize(file.file_size)} •{" "}
                      {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {file.item && (
                    <Badge variant="secondary" className="text-xs">
                      {file.item.title}
                    </Badge>
                  )}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
