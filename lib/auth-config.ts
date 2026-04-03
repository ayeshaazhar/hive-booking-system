import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { prisma } from "./prisma"

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
        await prisma.user.upsert({
          where: { email: user.email! },
          update: {
            name: user.name ?? "No Name",
          },
          create: {
            name: user.name ?? "No Name",
            email: user.email!,
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
        // Look up the user in the database by email
        const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
        if (dbUser) {
          token.id = dbUser.id; // Use the database ID
        }
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;

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
      if (session.user && token.id) {
        session.user.id = token.id as string;
        console.log('SESSION CALLBACK:', { sessionUser: session.user, tokenId: token.id });
      }
      return session;
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
