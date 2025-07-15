"use client"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { AuthProvider } from "@/contexts/auth-context"
import { BookingProvider } from "@/contexts/booking-context"
import { AdminDataProvider } from "@/contexts/admin-data-context"

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <SessionProvider>
        <AuthProvider>
          <BookingProvider>
            <AdminDataProvider>{children}</AdminDataProvider>
          </BookingProvider>
        </AuthProvider>
      </SessionProvider>
    </NextThemesProvider>
  )
}
