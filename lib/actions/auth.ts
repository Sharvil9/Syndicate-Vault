"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { signUpSchema, signInSchema, inviteSignUpSchema, generateInviteSchema } from "@/lib/schemas/auth"
import { ratelimit } from "@/lib/ratelimit"

export async function signInWithMagicLink(prevState: any, formData: FormData) {
  const ip = headers().get("x-forwarded-for") ?? "127.0.0.1"
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return { error: "Too many requests. Please try again later." }
  }

  const email = formData.get("email")?.toString()
  if (!email) {
    return { error: "Email is required" }
  }

  const supabase = createClient()

  try {
    const origin = headers().get("origin")
    const redirectUrl = origin || `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/vault`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { success: "Check your email for the magic link!" }
  } catch (error) {
    console.error("Magic link error:", error)
    return { error: "Failed to send magic link" }
  }
}

export async function signInWithPhone(prevState: any, formData: FormData) {
  const ip = headers().get("x-forwarded-for") ?? "127.0.0.1"
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return { error: "Too many requests. Please try again later." }
  }

  const phone = formData.get("phone")?.toString()
  if (!phone) {
    return { error: "Phone number is required" }
  }

  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: "Check your phone for the verification code!" }
  } catch (error) {
    console.error("Phone auth error:", error)
    return { error: "Failed to send verification code" }
  }
}

export async function verifyOtp(prevState: any, formData: FormData) {
  const email = formData.get("email")?.toString()
  const phone = formData.get("phone")?.toString()
  const token = formData.get("token")?.toString()
  const type = formData.get("type")?.toString() as "email" | "sms"

  if (!token) {
    return { error: "Verification code is required" }
  }

  const supabase = createClient()

  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      phone,
      token,
      type,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: "Successfully verified!" }
  } catch (error) {
    console.error("OTP verification error:", error)
    return { error: "Failed to verify code" }
  }
}

export async function signInWithInvite(prevState: any, formData: FormData) {
  const ip = headers().get("x-forwarded-for") ?? "127.0.0.1"
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return { error: "Too many requests. Please try again later." }
  }

  if (!formData) {
    return { error: "Form data is missing" }
  }

  const rawData = {
    email: formData.get("email")?.toString(),
    password: formData.get("password")?.toString(),
    inviteCode: formData.get("inviteCode")?.toString(),
  }

  const validation = inviteSignUpSchema.safeParse(rawData)
  if (!validation.success) {
    const errors = validation.error.errors.map((err) => err.message).join(", ")
    return { error: errors }
  }

  const { email, password, inviteCode } = validation.data

  const supabase = createClient()
  if (!supabase) {
    return { error: "Database connection failed" }
  }

  try {
    // Check if invite code is valid
    const { data: invite, error: inviteError } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("code", inviteCode)
      .single()

    if (inviteError || !invite) {
      return { error: "Invalid invite code" }
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return { error: "Invite code has expired" }
    }

    if (invite.current_uses >= invite.max_uses) {
      return { error: "Invite code has reached maximum uses" }
    }

    const origin = headers().get("origin")
    const redirectUrl = origin || `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/vault`

    // Sign up the user - let the database trigger handle profile creation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          invite_code: inviteCode,
          invited_by: invite.created_by,
        },
      },
    })

    if (authError) {
      return { error: authError.message }
    }

    if (authData.user) {
      // Update invite code usage
      await supabase
        .from("invite_codes")
        .update({
          current_uses: invite.current_uses + 1,
          used_by: authData.user.id,
          used_at: new Date().toISOString(),
        })
        .eq("id", invite.id)

      return { success: "Account created! Please check your email to verify your account." }
    }

    return { error: "Failed to create account" }
  } catch (error) {
    console.error("Signup error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signIn(prevState: any, formData: FormData) {
  // Rate limiting
  const ip = headers().get("x-forwarded-for") ?? "127.0.0.1"
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return { error: "Too many requests. Please try again later." }
  }

  if (!formData) {
    return { error: "Form data is missing" }
  }

  const rawData = {
    email: formData.get("email")?.toString(),
    password: formData.get("password")?.toString(),
  }

  const validation = signInSchema.safeParse(rawData)
  if (!validation.success) {
    const errors = validation.error.errors.map((err) => err.message).join(", ")
    return { error: errors }
  }

  const { email, password } = validation.data

  const supabase = createClient()
  if (!supabase) {
    return { error: "Database connection failed" }
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: "Invalid email or password" }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("activity_log").insert({
        user_id: user.id,
        action: "user_login",
        resource_type: "user",
        resource_id: user.id,
        ip_address: ip,
        user_agent: headers().get("user-agent"),
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  // Rate limiting
  const ip = headers().get("x-forwarded-for") ?? "127.0.0.1"
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return { error: "Too many requests. Please try again later." }
  }

  if (!formData) {
    return { error: "Form data is missing" }
  }

  const rawData = {
    email: formData.get("email")?.toString(),
    password: formData.get("password")?.toString(),
    fullName: formData.get("fullName")?.toString(),
  }

  const validation = signUpSchema.safeParse(rawData)
  if (!validation.success) {
    const errors = validation.error.errors.map((err) => err.message).join(", ")
    return { error: errors }
  }

  const { email, password, fullName } = validation.data

  const supabase = createClient()
  if (!supabase) {
    return { error: "Database connection failed" }
  }

  try {
    const { count } = await supabase.from("users").select("*", { count: "exact", head: true })

    const isFirstUser = count === 0

    const origin = headers().get("origin")
    const redirectUrl = origin || `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/vault`

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          is_first_user: isFirstUser,
        },
      },
    })

    if (authError) {
      return { error: authError.message }
    }

    if (authData.user) {
      if (!authData.user.email_confirmed_at) {
        return {
          success: isFirstUser
            ? "Welcome! You're the first user and will be made an admin after email verification. Please check your email to verify your account."
            : "Account created! Please check your email to verify your account. An admin will need to approve your access after verification.",
        }
      }
    }

    return { error: "Failed to create account" }
  } catch (error) {
    console.error("Signup error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const supabase = createClient()
  if (supabase) {
    await supabase.auth.signOut()
  }
  redirect("/")
}

export async function generateInviteCode(prevState: any, formData: FormData) {
  const supabase = createClient()
  if (!supabase) {
    return { error: "Database connection failed" }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Check if user is admin
  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (!userProfile || userProfile.role !== "admin") {
    return { error: "Only admins can generate invite codes" }
  }

  const rawData = {
    maxUses: Number.parseInt(formData.get("maxUses")?.toString() || "1"),
    expiresIn: Number.parseInt(formData.get("expiresIn")?.toString() || "7"),
  }

  const validation = generateInviteSchema.safeParse(rawData)
  if (!validation.success) {
    const errors = validation.error.errors.map((err) => err.message).join(", ")
    return { error: errors }
  }

  const { maxUses, expiresIn } = validation.data

  // Generate random invite code
  const code = Math.random().toString(36).substring(2, 15).toUpperCase()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresIn)

  try {
    const { error } = await supabase.from("invite_codes").insert({
      code,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
      max_uses: maxUses,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: `Invite code created: ${code}` }
  } catch (error) {
    console.error("Invite code generation error:", error)
    return { error: "Failed to generate invite code" }
  }
}
