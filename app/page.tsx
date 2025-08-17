import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function HomePage() {
  const supabase = createClient()

  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      redirect("/vault")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-purple-300/10 to-white/5 animate-pulse"></div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-2xl">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-white tracking-tight">
              Syndicate
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Vault</span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              A private, invite-only knowledge repository for your syndicate. Save, organize, and share insights with
              your trusted network.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
            >
              <Link href="/auth/signup">Create Account</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-3 text-lg bg-transparent"
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>

          <p className="text-sm text-slate-400">
            Have an invite code?{" "}
            <Link href="/invite" className="text-purple-400 hover:text-purple-300 underline">
              Use invite signup
            </Link>{" "}
            • Try passwordless?{" "}
            <Link href="/auth/magic-link" className="text-purple-400 hover:text-purple-300 underline">
              Magic link
            </Link>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
              <div className="text-2xl mb-3">🔒</div>
              <h3 className="text-lg font-semibold text-white mb-2">Private & Secure</h3>
              <p className="text-slate-400">Invite-only access with role-based permissions and encrypted storage.</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
              <div className="text-2xl mb-3">📚</div>
              <h3 className="text-lg font-semibold text-white mb-2">Organized Knowledge</h3>
              <p className="text-slate-400">Personal and common spaces with categories, tags, and powerful search.</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
              <div className="text-2xl mb-3">🌐</div>
              <h3 className="text-lg font-semibold text-white mb-2">Save from Web</h3>
              <p className="text-slate-400">Bookmarklet and browser extension to capture content instantly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
