"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Users,
  UserIcon,
  Plus,
  Settings,
  ChevronDown,
  ChevronRight,
  Folder,
  Hash,
  Shield,
  Menu,
  X,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { User as UserProfile, Space } from "@/lib/types/database"

interface VaultSidebarProps {
  user: SupabaseUser
  profile: UserProfile | null
  spaces: Space[]
}

export default function VaultSidebar({ user, profile, spaces }: VaultSidebarProps) {
  const pathname = usePathname()
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set())
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleSpace = (spaceId: string) => {
    const newExpanded = new Set(expandedSpaces)
    if (newExpanded.has(spaceId)) {
      newExpanded.delete(spaceId)
    } else {
      newExpanded.add(spaceId)
    }
    setExpandedSpaces(newExpanded)
  }

  const commonSpaces = spaces.filter((s) => s.type === "common")
  const personalSpaces = spaces.filter((s) => s.type === "personal")

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Syndicate Vault</h2>
            <p className="text-sm text-slate-400 mt-1">{profile?.full_name || user.email}</p>
            {profile?.role === "admin" && (
              <Badge variant="secondary" className="mt-2 bg-purple-600 text-white">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <nav className="space-y-6 py-6" role="navigation" aria-label="Main navigation">
          {/* Navigation */}
          <div className="space-y-2">
            <Link
              href="/vault"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500",
                pathname === "/vault" ? "bg-purple-600 text-white" : "text-slate-300 hover:bg-slate-700/50",
              )}
              onClick={() => setIsMobileOpen(false)}
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>

            <Link
              href="/vault/search"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500",
                pathname === "/vault/search" ? "bg-purple-600 text-white" : "text-slate-300 hover:bg-slate-700/50",
              )}
              onClick={() => setIsMobileOpen(false)}
            >
              <Hash className="h-4 w-4" />
              Search
            </Link>

            <Link
              href="/vault/files"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500",
                pathname === "/vault/files" ? "bg-purple-600 text-white" : "text-slate-300 hover:bg-slate-700/50",
              )}
              onClick={() => setIsMobileOpen(false)}
            >
              <FileText className="h-4 w-4" />
              Files
            </Link>

            {profile?.role === "admin" && (
              <Link
                href="/vault/admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500",
                  pathname.startsWith("/vault/admin")
                    ? "bg-purple-600 text-white"
                    : "text-slate-300 hover:bg-slate-700/50",
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </div>

          <Separator className="bg-slate-700" />

          {/* Common Spaces */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Common Spaces</h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Add common space"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {commonSpaces.map((space) => (
              <div key={space.id} className="space-y-1">
                <button
                  onClick={() => toggleSpace(space.id)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-expanded={expandedSpaces.has(space.id)}
                  aria-controls={`space-${space.id}-content`}
                >
                  {expandedSpaces.has(space.id) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <Users className="h-4 w-4" />
                  <span className="flex-1 text-left">{space.name}</span>
                </button>

                {expandedSpaces.has(space.id) && (
                  <div id={`space-${space.id}-content`} className="ml-6 space-y-1">
                    <Link
                      href={`/vault/space/${space.id}`}
                      className="flex items-center gap-2 px-3 py-1 rounded text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-700/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <Folder className="h-3 w-3" />
                      All Items
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator className="bg-slate-700" />

          {/* Personal Spaces */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Personal Spaces</h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Add personal space"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {personalSpaces.map((space) => (
              <div key={space.id} className="space-y-1">
                <button
                  onClick={() => toggleSpace(space.id)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-expanded={expandedSpaces.has(space.id)}
                  aria-controls={`space-${space.id}-content`}
                >
                  {expandedSpaces.has(space.id) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <UserIcon className="h-4 w-4" />
                  <span className="flex-1 text-left">{space.name}</span>
                </button>

                {expandedSpaces.has(space.id) && (
                  <div id={`space-${space.id}-content`} className="ml-6 space-y-1">
                    <Link
                      href={`/vault/space/${space.id}`}
                      className="flex items-center gap-2 px-3 py-1 rounded text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-700/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <Folder className="h-3 w-3" />
                      All Items
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-slate-700">
        <Link
          href="/vault/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          onClick={() => setIsMobileOpen(false)}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </>
  )

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50 bg-slate-800/80 backdrop-blur-sm text-white hover:bg-slate-700"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "bg-slate-800/50 backdrop-blur-sm border-r border-slate-700 flex flex-col transition-transform duration-300 ease-in-out",
          "md:relative md:translate-x-0 md:w-80",
          "fixed inset-y-0 left-0 z-50 w-80",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <SidebarContent />
      </div>
    </>
  )
}
