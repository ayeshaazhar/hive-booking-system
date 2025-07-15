declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      company: string
      department: string
      phone: string
      joinDate: string
      totalBookings: number
      status: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name: string
    picture?: string
    company: string
    department: string
    phone: string
    joinDate: string
    totalBookings: number
    status: string
  }
}
