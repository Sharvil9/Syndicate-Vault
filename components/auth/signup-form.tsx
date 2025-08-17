"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUp } from "@/lib/actions/auth"
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react"

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const router = useRouter()

  const passwordRequirements = [
    { test: (p: string) => p.length >= 8, text: "At least 8 characters" },
    { test: (p: string) => /[A-Z]/.test(p), text: "One uppercase letter" },
    { test: (p: string) => /[a-z]/.test(p), text: "One lowercase letter" },
    { test: (p: string) => /[0-9]/.test(p), text: "One number" },
    { test: (p: string) => /[^A-Za-z0-9]/.test(p), text: "One special character" },
  ]

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setMessage("")

    try {
      const result = await signUp(null, formData)

      if (result.error) {
        setMessage(result.error)
      } else {
        setMessage(result.success || "Account created successfully! Please check your email to verify your account.")
        // Redirect after a delay
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
      }
    } catch (error) {
      setMessage("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName" className="text-gray-300">
            Full Name
          </Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            required
            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-gray-300">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <Label htmlFor="password" className="text-gray-300">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 pr-10"
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {password && (
            <div className="mt-2 space-y-1">
              {passwordRequirements.map((req, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs">
                  {req.test(password) ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                  <span className={req.test(password) ? "text-green-400" : "text-red-400"}>{req.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.includes("successfully") || message.includes("Welcome")
              ? "bg-green-900/50 text-green-300 border border-green-700/50"
              : "bg-red-900/50 text-red-300 border border-red-700/50"
          }`}
        >
          {message}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
      >
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>

      <div className="text-center space-y-2">
        <p className="text-gray-400 text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            Sign in
          </Link>
        </p>
        <p className="text-gray-400 text-sm">
          Have an invite code?{" "}
          <Link href="/invite" className="text-purple-400 hover:text-purple-300 transition-colors">
            Use invite
          </Link>
        </p>
      </div>
    </form>
  )
}
