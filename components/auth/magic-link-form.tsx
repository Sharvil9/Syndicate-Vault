"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Mail } from "lucide-react"
import Link from "next/link"
import { signInWithMagicLink } from "@/lib/actions/auth"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending magic link...
        </>
      ) : (
        <>
          <Mail className="mr-2 h-4 w-4" />
          Send Magic Link
        </>
      )}
    </Button>
  )
}

export default function MagicLinkForm() {
  const [state, formAction] = useActionState(signInWithMagicLink, null)

  return (
    <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-white">Magic Link Sign In</CardTitle>
        <CardDescription className="text-slate-400">
          Enter your email and we'll send you a magic link to sign in
        </CardDescription>
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
              {state.success}
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
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          <SubmitButton />

          <div className="text-center text-slate-400 text-sm space-y-2">
            <div>
              <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 hover:underline">
                Back to password login
              </Link>
            </div>
            <div>
              Need an invite?{" "}
              <Link href="/invite" className="text-purple-400 hover:text-purple-300 hover:underline">
                Sign up with invite code
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
