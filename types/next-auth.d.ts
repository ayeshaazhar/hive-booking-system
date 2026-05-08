import type { DefaultSession } from "next-auth"
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
      isAdmin: boolean
      image?: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    company?: string
    department?: string
    phone?: string
    joinDate?: string
    totalBookings?: number
    status?: string
    isAdmin?: boolean
    image?: string | null
  }
}
