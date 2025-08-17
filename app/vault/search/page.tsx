import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SearchInterface from "@/components/vault/search-interface"

export default async function SearchPage() {
  const supabase = createClient()

  if (!supabase) {
    redirect("/auth/login")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's spaces and categories for filters
  const { data: spaces } = await supabase
    .from("spaces")
    .select("*")
    .or(`owner_id.eq.${user.id},type.eq.common`)
    .order("type", { ascending: false })

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .in("space_id", spaces?.map((s) => s.id) || [])
    .order("name")

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Search Vault</h1>
        <p className="text-slate-400">Find content across all your spaces</p>
      </div>

      <SearchInterface spaces={spaces || []} categories={categories || []} />
    </div>
  )
}
