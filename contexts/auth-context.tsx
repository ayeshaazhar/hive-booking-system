"use client"

import React, { createContext, useContext, useState, type ReactNode } from "react"
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
  updateProfile: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [profileOverrides, setProfileOverrides] = useState<Partial<User>>({})

  // Load profile overrides from localStorage on mount
  React.useEffect(() => {
    const savedOverrides = localStorage.getItem("profile-overrides")
    if (savedOverrides) {
      try {
        setProfileOverrides(JSON.parse(savedOverrides))
      } catch (error) {
        console.error("Error loading profile overrides:", error)
      }
    }
  }, [])

  // Merge session data with local overrides
  const user: User | null = session?.user
    ? {
        id: (session.user as any).id || session.user.email || "unknown",
        name: session.user.name || "Unknown User",
        email: session.user.email || "",
        company: profileOverrides.company || (session.user as any).company || "Your Company",
        department: profileOverrides.department || (session.user as any).department || "General",
        phone: profileOverrides.phone || (session.user as any).phone || "",
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

  const updateProfile = (updates: Partial<User>) => {
    // Store updates locally (in a real app, you'd also update the backend)
    setProfileOverrides((prev) => ({ ...prev, ...updates }))

    // Also store in localStorage for persistence
    const currentOverrides = JSON.parse(localStorage.getItem("profile-overrides") || "{}")
    const newOverrides = { ...currentOverrides, ...updates }
    localStorage.setItem("profile-overrides", JSON.stringify(newOverrides))
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
