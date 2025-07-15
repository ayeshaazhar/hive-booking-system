import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow all Google sign-ins - no restrictions
      if (account?.provider === "google") {
        return true
      }
      return false
    },
    async jwt({ token, user, account }) {
      // First time JWT callback is run, user object is available
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image

        // Set default values for new Google users
        token.company = extractCompanyFromEmail(user.email!) || "Your Company"
        token.department = "General"
        token.phone = ""
        token.joinDate = new Date().toISOString().split("T")[0]
        token.totalBookings = 0
        token.status = "active"
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
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
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Helper function to extract company name from email domain
function extractCompanyFromEmail(email: string): string | null {
  const domain = email.split("@")[1]
  if (!domain) return null

  // Remove common email providers and extract company name
  const commonProviders = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"]

  if (commonProviders.includes(domain.toLowerCase())) {
    return null // Return null for personal email providers
  }

  // Extract company name from domain (e.g., company.com -> Company)
  const companyName = domain.split(".")[0]
  return companyName.charAt(0).toUpperCase() + companyName.slice(1)
}
