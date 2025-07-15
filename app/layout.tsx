import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Hive Member Portal",
  description: "Manage your bookings and resources at Hive.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
