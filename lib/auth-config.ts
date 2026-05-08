import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { prisma } from "./prisma"
import { isAdminEmail } from "./admin-auth"
import { getOrCreateDefaultOrganization } from "./organization"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
    if (account?.provider === "google" || account?.provider === "github") {
      // ✅ Sync the user to the database
      try {
        const org = await getOrCreateDefaultOrganization()
        await prisma.user.upsert({
          where: { email: user.email! },
          update: {
            name: user.name ?? "No Name",
            organizationId: org.id,
            isActive: true,
          },
          create: {
            name: user.name ?? "No Name",
            email: user.email!,
            organizationId: org.id,
            isActive: true,
          },
        })
      } catch (error) {
        console.error("Error syncing user to DB:", error)
        return false
      }

      return true
    }
    return false
  },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
        token.name = user.name
        token.picture = user.image

        const domain = user.email?.split("@")[1] || ""
        const commonProviders = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"]

        if (commonProviders.includes(domain.toLowerCase())) {
          token.company = "Personal Account"
        } else {
          const companyName = domain.split(".")[0]
          token.company = companyName.charAt(0).toUpperCase() + companyName.slice(1)
        }

        token.department = "General"
        token.phone = ""
        token.joinDate = new Date().toISOString().split("T")[0]
        token.totalBookings = 0
        token.status = "active"
      }

      const email = typeof token.email === "string" ? token.email : undefined
      if (email) {
        const dbUser = await prisma.user.findUnique({ where: { email } })
        if (dbUser) {
          token.id = dbUser.id
          token.isAdmin = dbUser.role === "admin" || isAdminEmail(dbUser.email)
        } else {
          token.isAdmin = isAdminEmail(email)
        }
      } else {
        token.isAdmin = false
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      if (session.user) {
        session.user.isAdmin = Boolean(token.isAdmin)
        session.user.company = (token.company as string) ?? session.user.company ?? ""
        session.user.department = (token.department as string) ?? session.user.department ?? ""
        session.user.phone = (token.phone as string) ?? session.user.phone ?? ""
        session.user.joinDate = (token.joinDate as string) ?? session.user.joinDate ?? ""
        session.user.totalBookings = (token.totalBookings as number) ?? 0
        session.user.status = (token.status as string) ?? session.user.status ?? "active"
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
