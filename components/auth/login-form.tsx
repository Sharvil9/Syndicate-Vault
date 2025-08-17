"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { signIn } from "@/lib/actions/auth"
import { useSearchParams } from "next/navigation"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        "Sign In"
      )}
    </Button>
  )
}

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get("message")
  const [state, formAction] = useActionState(signIn, null)

  useEffect(() => {
    if (state?.success) {
      router.push("/vault")
    }
  }, [state, router])

  return (
    <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
        <CardDescription className="text-slate-400">Sign in to access your vault</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {message && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded text-sm">
              {message}
            </div>
          )}

          {state?.error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm" role="alert">
              {state.error}
            </div>
          )}

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
              aria-describedby="email-error"
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              aria-describedby="password-error"
              className="bg-slate-900/50 border-slate-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <SubmitButton />

          <div className="text-center text-slate-400 text-sm space-y-2">
            <div>
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-purple-400 hover:text-purple-300 hover:underline focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 rounded"
              >
                Create account
              </Link>
            </div>
            <div>
              Have an invite code?{" "}
              <Link
                href="/invite"
                className="text-purple-400 hover:text-purple-300 hover:underline focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 rounded"
              >
                Use invite signup
              </Link>
            </div>
            <div>
              Prefer passwordless?{" "}
              <Link
                href="/auth/magic-link"
                className="text-purple-400 hover:text-purple-300 hover:underline focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 rounded"
              >
                Magic link
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
