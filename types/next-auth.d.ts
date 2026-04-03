import type { DefaultSession, DefaultUser } from "next-auth"
import type { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      company: string
      department: string
      phone: string
      joinDate: string
      totalBookings: number
      status: string
      image?: string | null  // ✅ Add this
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    company?: string
    department?: string
    phone?: string
    joinDate?: string
    totalBookings?: number
    status?: string
    image?: string | null // ✅ Add this
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    company: string
    department: string
    phone: string
    joinDate: string
    totalBookings: number
    status: string
    image?: string | null // ✅ Add this (if you use it in callbacks)
  }
}
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      company: string
      department: string
      phone: string
      joinDate: string
      totalBookings: number
      status: string
    }
  }
}
