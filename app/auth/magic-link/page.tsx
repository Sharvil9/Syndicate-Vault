import MagicLinkForm from "@/components/auth/magic-link-form"

export default function MagicLinkPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-purple-900/30 to-slate-900/50 animate-pulse"></div>
      <MagicLinkForm />
    </div>
  )
}
