"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Plus, Bell, Settings, LogOut } from "lucide-react"
import { signOut } from "@/lib/actions/auth"
import { useRouter } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { User as UserProfile } from "@/lib/types/database"

interface VaultHeaderProps {
  user: SupabaseUser
  profile: UserProfile | null
}

export default function VaultHeader({ user, profile }: VaultHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      router.push(`/vault/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error("Sign out error:", error)
      setIsSigningOut(false)
    }
  }

  return (
    <header className="h-16 bg-slate-800/30 backdrop-blur-sm border-b border-slate-700 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-4 flex-1 ml-12 md:ml-0">
        <form onSubmit={handleSearch} className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search vault..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            disabled={isSearching}
            aria-label="Search vault"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </form>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <Button
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white focus:ring-2 focus:ring-purple-500/20 hidden sm:flex"
        >
          <Plus className="h-4 w-4 mr-2" />
          Quick Add
        </Button>

        <Button
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white focus:ring-2 focus:ring-purple-500/20 sm:hidden"
          aria-label="Quick add"
        >
          <Plus className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="text-slate-300 hover:text-white hover:bg-slate-700 focus:ring-2 focus:ring-purple-500/20"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full focus:ring-2 focus:ring-purple-500/20"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={profile?.avatar_url || "/placeholder.svg"}
                  alt={profile?.full_name || user.email || ""}
                />
                <AvatarFallback className="bg-purple-600 text-white">
                  {(profile?.full_name || user.email || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-white">{profile?.full_name || "User"}</p>
                <p className="w-[200px] truncate text-sm text-slate-400">{user.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem className="text-slate-300 hover:bg-slate-700 hover:text-white focus:bg-slate-700 focus:text-white">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem
              className="text-slate-300 hover:bg-slate-700 hover:text-white focus:bg-slate-700 focus:text-white"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
