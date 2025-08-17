"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  CalendarIcon,
  Star,
  ExternalLink,
  FileText,
  Image,
  Video,
  Music,
  File,
  Bookmark,
  Code,
  MoreHorizontal,
  X,
} from "lucide-react"
import { format } from "date-fns"
import type { Space, Category } from "@/lib/types/database"
import { formatDistanceToNow } from "date-fns"

interface SearchInterfaceProps {
  spaces: Space[]
  categories: Category[]
}

interface SearchFilters {
  query: string
  type?: string
  space_id?: string
  category_id?: string
  tags: string[]
  date_from?: Date
  date_to?: Date
  is_favorite?: boolean
  sort_by: string
  sort_order: string
}

interface SearchResult {
  id: string
  title: string
  content?: string
  url?: string
  excerpt?: string
  type: string
  tags: string[]
  is_favorite: boolean
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
    icon: string
    color: string
  }
  space: {
    id: string
    name: string
    type: string
  }
  attachments?: Array<{
    id: string
    filename: string
    mime_type: string
    file_size: number
  }>
}

export default function SearchInterface({ spaces, categories }: SearchInterfaceProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    tags: [],
    sort_by: "created_at",
    sort_order: "desc",
  })

  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [tagInput, setTagInput] = useState("")

  const limit = 20

  const performSearch = useCallback(
    async (resetOffset = true) => {
      setLoading(true)
      const searchOffset = resetOffset ? 0 : offset

      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: searchOffset.toString(),
          sort_by: filters.sort_by,
          sort_order: filters.sort_order,
        })

        if (filters.query) params.append("query", filters.query)
        if (filters.type) params.append("type", filters.type)
        if (filters.space_id) params.append("space_id", filters.space_id)
        if (filters.category_id) params.append("category_id", filters.category_id)
        if (filters.tags.length > 0) params.append("tags", filters.tags.join(","))
        if (filters.date_from) params.append("date_from", filters.date_from.toISOString())
        if (filters.date_to) params.append("date_to", filters.date_to.toISOString())
        if (filters.is_favorite !== undefined) params.append("is_favorite", filters.is_favorite.toString())

        const response = await fetch(`/api/search?${params}`)
        const data = await response.json()

        if (response.ok) {
          if (resetOffset) {
            setResults(data.items)
            setOffset(data.limit)
          } else {
            setResults((prev) => [...prev, ...data.items])
            setOffset((prev) => prev + data.limit)
          }
          setTotal(data.total)
          setHasMore(data.hasMore)
        } else {
          console.error("Search error:", data.error)
        }
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    },
    [filters, offset],
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [filters.query])

  // Search when filters change (except query)
  useEffect(() => {
    performSearch(true)
  }, [
    filters.type,
    filters.space_id,
    filters.category_id,
    filters.tags,
    filters.date_from,
    filters.date_to,
    filters.is_favorite,
    filters.sort_by,
    filters.sort_order,
  ])

  const addTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim())) {
      setFilters((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const clearFilters = () => {
    setFilters({
      query: "",
      tags: [],
      sort_by: "created_at",
      sort_order: "desc",
    })
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <Image className="h-4 w-4" />
    if (mimeType.startsWith("video/")) return <Video className="h-4 w-4" />
    if (mimeType.startsWith("audio/")) return <Music className="h-4 w-4" />
    if (mimeType === "application/pdf") return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bookmark":
        return <Bookmark className="h-4 w-4" />
      case "note":
        return <FileText className="h-4 w-4" />
      case "snippet":
        return <Code className="h-4 w-4" />
      case "file":
        return <File className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search your vault..."
                value={filters.query}
                onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Active Filters */}
          {(filters.type ||
            filters.space_id ||
            filters.category_id ||
            filters.tags.length > 0 ||
            filters.date_from ||
            filters.date_to ||
            filters.is_favorite !== undefined) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {filters.type && (
                <Badge variant="secondary" className="bg-purple-600/20 text-purple-400">
                  Type: {filters.type}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => setFilters((prev) => ({ ...prev, type: undefined }))}
                  />
                </Badge>
              )}
              {filters.space_id && (
                <Badge variant="secondary" className="bg-blue-600/20 text-blue-400">
                  Space: {spaces.find((s) => s.id === filters.space_id)?.name}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => setFilters((prev) => ({ ...prev, space_id: undefined }))}
                  />
                </Badge>
              )}
              {filters.category_id && (
                <Badge variant="secondary" className="bg-green-600/20 text-green-400">
                  Category: {categories.find((c) => c.id === filters.category_id)?.name}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => setFilters((prev) => ({ ...prev, category_id: undefined }))}
                  />
                </Badge>
              )}
              {filters.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-orange-600/20 text-orange-400">
                  {tag}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
              {filters.is_favorite && (
                <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400">
                  Favorites only
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => setFilters((prev) => ({ ...prev, is_favorite: undefined }))}
                  />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-400 hover:text-white">
                Clear all
              </Button>
            </div>
          )}

          {/* Filter Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Type</label>
                <Select
                  value={filters.type || ""}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value || undefined }))}
                >
                  <SelectTrigger className="bg-slate-900/50 border-slate-600">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="bookmark">Bookmarks</SelectItem>
                    <SelectItem value="note">Notes</SelectItem>
                    <SelectItem value="file">Files</SelectItem>
                    <SelectItem value="snippet">Snippets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Space</label>
                <Select
                  value={filters.space_id || ""}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, space_id: value || undefined }))}
                >
                  <SelectTrigger className="bg-slate-900/50 border-slate-600">
                    <SelectValue placeholder="All spaces" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="">All spaces</SelectItem>
                    {spaces.map((space) => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Category</label>
                <Select
                  value={filters.category_id || ""}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, category_id: value || undefined }))}
                >
                  <SelectTrigger className="bg-slate-900/50 border-slate-600">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Sort by</label>
                <div className="flex gap-2">
                  <Select
                    value={filters.sort_by}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, sort_by: value }))}
                  >
                    <SelectTrigger className="bg-slate-900/50 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="created_at">Created</SelectItem>
                      <SelectItem value="updated_at">Updated</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      {filters.query && <SelectItem value="relevance">Relevance</SelectItem>}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        sort_order: prev.sort_order === "asc" ? "desc" : "asc",
                      }))
                    }
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    {filters.sort_order === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Tags</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  <Button onClick={addTag} size="sm" className="bg-purple-600 hover:bg-purple-700">
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Date Range</label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {filters.date_from ? format(filters.date_from, "MMM dd") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                      <Calendar
                        mode="single"
                        selected={filters.date_from}
                        onSelect={(date) => setFilters((prev) => ({ ...prev, date_from: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {filters.date_to ? format(filters.date_to, "MMM dd") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                      <Calendar
                        mode="single"
                        selected={filters.date_to}
                        onSelect={(date) => setFilters((prev) => ({ ...prev, date_to: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Options</label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="favorites"
                    checked={filters.is_favorite === true}
                    onCheckedChange={(checked) =>
                      setFilters((prev) => ({
                        ...prev,
                        is_favorite: checked ? true : undefined,
                      }))
                    }
                  />
                  <label htmlFor="favorites" className="text-sm text-slate-300">
                    Favorites only
                  </label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <p className="text-slate-400">
            {loading ? "Searching..." : `${total} result${total !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* Results List */}
        {results.map((item) => (
          <Card
            key={item.id}
            className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:bg-slate-800/70 transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2 bg-slate-700/50 rounded-lg">{getTypeIcon(item.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-white truncate">{item.title}</h3>
                    {item.is_favorite && <Star className="h-4 w-4 text-yellow-400 fill-current" />}
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 text-slate-400 hover:text-white" />
                      </a>
                    )}
                  </div>

                  {item.excerpt && <p className="text-sm text-slate-400 mb-3 line-clamp-2">{item.excerpt}</p>}

                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                    <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                    {item.category && (
                      <>
                        <span>•</span>
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{ backgroundColor: item.category.color + "20", color: item.category.color }}
                        >
                          {item.category.icon} {item.category.name}
                        </Badge>
                      </>
                    )}
                    <span>•</span>
                    <span className="capitalize">{item.space.name}</span>
                  </div>

                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs border-slate-600 text-slate-400">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Attachments */}
                  {item.attachments && item.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300"
                        >
                          {getFileIcon(attachment.mime_type)}
                          <span>{attachment.filename}</span>
                          <span className="text-slate-500">({Math.round(attachment.file_size / 1024)}KB)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Load More */}
        {hasMore && (
          <div className="text-center">
            <Button
              onClick={() => performSearch(false)}
              disabled={loading}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {loading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}

        {/* No Results */}
        {!loading && results.length === 0 && (
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No results found</h3>
              <p className="text-slate-400 mb-4">Try adjusting your search terms or filters</p>
              <Button onClick={clearFilters} className="bg-purple-600 hover:bg-purple-700">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
