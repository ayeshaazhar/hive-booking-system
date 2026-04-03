"use client"

import React, { createContext, useContext, type ReactNode } from "react"
import { useSession, signIn, signOut } from "next-auth/react"

interface User {
  id: string
  name: string
  email: string
  company: string
  department: string
  phone: string
  avatar?: string
  joinDate: string
  totalBookings: number
  status: string
}

interface AuthContextType {
  user: User | null
  login: () => Promise<void>
  logout: () => Promise<void>
  loading: boolean
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession()

  const user: User | null = session?.user
    ? {
        id: (session.user as any).id || session.user.email || "unknown",
        name: session.user.name || "Unknown User",
        email: session.user.email || "",
        company: (session.user as any).company || "Your Company",
        department: (session.user as any).department || "General",
        phone: (session.user as any).phone || "",
        avatar: session.user.image || undefined,
        joinDate: (session.user as any).joinDate || new Date().toISOString().split("T")[0],
        totalBookings: (session.user as any).totalBookings || 0,
        status: (session.user as any).status || "active",
      }
    : null

  const login = async () => {
    await signIn("google", { callbackUrl: "/dashboard" })
  }

  const logout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return
    await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...updates, id: user.id }),
    })
    if (typeof update === "function") {
      await update()
    }
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading: status === "loading",
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
