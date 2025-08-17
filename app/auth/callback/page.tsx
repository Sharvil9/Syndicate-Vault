import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  const supabase = createClient()

  if (searchParams.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(searchParams.code)

    if (!error) {
      redirect("/vault")
    }
  }

  // If there's an error or no code, redirect to login
  redirect("/auth/login?error=Authentication failed")
}
