"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { signInWithInvite } from "@/lib/actions/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating account...
        </>
      ) : (
        "Create Account"
      )}
    </Button>
  )
}

export default function InviteSignupForm() {
  const router = useRouter()
  const [state, formAction] = useActionState(signInWithInvite, null)

  useEffect(() => {
    if (state?.success && !state?.error) {
      // Redirect to login page after successful signup
      setTimeout(() => {
        router.push("/auth/login?message=Account created! Please sign in.")
      }, 2000)
    }
  }, [state, router])

  return (
    <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-white">Create Your Account</CardTitle>
        <CardDescription className="text-slate-400">Enter your invite code to join the vault</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded text-sm">
              {state.success} Redirecting to sign in...
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="inviteCode" className="block text-sm font-medium text-slate-300">
              Invite Code
            </label>
            <Input
              id="inviteCode"
              name="inviteCode"
              type="text"
              placeholder="Enter your invite code"
              required
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 uppercase"
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase()
              }}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="bg-slate-900/50 border-slate-600 text-white"
            />
          </div>

          <SubmitButton />

          <div className="text-center text-slate-400 text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
