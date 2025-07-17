import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"

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
        return true
      }
      return false
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image

        // Extract company from email domain
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
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.company = token.company as string
        session.user.department = token.department as string
        session.user.phone = token.phone as string
        session.user.joinDate = token.joinDate as string
        session.user.totalBookings = token.totalBookings as number
        session.user.status = token.status as string
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
