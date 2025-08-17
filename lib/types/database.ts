export type UserRole = "admin" | "member"
export type SpaceType = "common" | "personal"
export type ItemType = "bookmark" | "note" | "file" | "snippet"
export type EditRequestStatus = "pending" | "approved" | "rejected"
export type UserStatus = "pending" | "approved" | "suspended"

// Base entity interface
interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// Soft deletable entity
interface SoftDeletable {
  deleted_at?: string | null
}

export interface User extends BaseEntity {
  email: string
  full_name?: string | null
  avatar_url?: string | null
  role: UserRole
  status: UserStatus
  invite_code?: string | null
  invited_by?: string | null
}

export interface Space extends BaseEntity, SoftDeletable {
  name: string
  description?: string | null
  type: SpaceType
  owner_id?: string | null
  is_public: boolean
}

export interface Category extends BaseEntity, SoftDeletable {
  name: string
  description?: string | null
  icon: string
  color: string
  space_id: string
  created_by: string
}

export interface Item extends BaseEntity, SoftDeletable {
  title: string
  content?: string | null
  url?: string | null
  html_snapshot?: string | null
  excerpt?: string | null
  type: ItemType
  tags: string[]
  category_id?: string | null
  space_id: string
  created_by: string
  is_favorite: boolean
}

export interface Attachment extends BaseEntity, SoftDeletable {
  item_id: string
  filename: string
  original_filename: string
  mime_type: string
  file_size: number
  storage_path: string
  uploaded_by: string
}

export interface Revision extends BaseEntity {
  item_id: string
  title?: string | null
  content?: string | null
  tags?: string[] | null
  changed_fields: string[]
  created_by: string
}

export interface EditRequest extends BaseEntity {
  item_id?: string | null
  requested_by: string
  title?: string | null
  content?: string | null
  tags?: string[] | null
  reason?: string | null
  status: EditRequestStatus
  reviewed_by?: string | null
  reviewed_at?: string | null
}

export interface ActivityLog extends BaseEntity {
  user_id: string
  action: string
  resource_type: string
  resource_id?: string | null
  details?: Record<string, any> | null
  ip_address?: string | null
  user_agent?: string | null
  session_id?: string | null
  request_id?: string | null
}

export interface InviteCode extends BaseEntity {
  code: string
  created_by: string
  used_by?: string | null
  expires_at?: string | null
  max_uses: number
  current_uses: number
  used_at?: string | null
}

// Utility types for API responses
export type CreateUserInput = Omit<User, keyof BaseEntity | "status" | "invite_code">
export type UpdateUserInput = Partial<Pick<User, "full_name" | "avatar_url" | "role" | "status">>

export type CreateSpaceInput = Omit<Space, keyof BaseEntity | keyof SoftDeletable>
export type UpdateSpaceInput = Partial<Pick<Space, "name" | "description" | "is_public">>

export type CreateItemInput = Omit<Item, keyof BaseEntity | keyof SoftDeletable | "created_by">
export type UpdateItemInput = Partial<
  Pick<Item, "title" | "content" | "url" | "excerpt" | "tags" | "category_id" | "is_favorite">
>

// Database query result types
export interface ItemWithRelations extends Item {
  category?: Pick<Category, "id" | "name" | "icon" | "color"> | null
  space?: Pick<Space, "id" | "name" | "type"> | null
  attachments?: Pick<Attachment, "id" | "filename" | "mime_type" | "file_size">[]
  creator?: Pick<User, "id" | "full_name" | "email"> | null
}

export interface SpaceWithStats extends Space {
  item_count?: number
  category_count?: number
  last_activity?: string | null
}

export interface UserWithStats extends User {
  item_count?: number
  space_count?: number
  last_login?: string | null
}

// Search and filter types
export interface SearchFilters {
  query?: string
  type?: ItemType
  space_id?: string
  category_id?: string
  tags?: string[]
  date_from?: string
  date_to?: string
  is_favorite?: boolean
  created_by?: string
}

export interface SortOptions {
  sort_by: "created_at" | "updated_at" | "title" | "relevance"
  sort_order: "asc" | "desc"
}

export interface PaginationOptions {
  limit: number
  offset: number
}

export interface SearchParams extends SearchFilters, SortOptions, PaginationOptions {}

// API response types
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    offset: number
    limit: number
    hasMore: boolean
  }
}

// Audit log action types
export type AuditAction =
  | "user_registered"
  | "user_login"
  | "user_logout"
  | "user_approved"
  | "user_suspended"
  | "space_created"
  | "space_updated"
  | "space_deleted"
  | "item_created"
  | "item_updated"
  | "item_deleted"
  | "item_restored"
  | "file_uploaded"
  | "edit_request_created"
  | "edit_request_approved"
  | "edit_request_rejected"
  | "invite_code_generated"
  | "invite_code_used"
