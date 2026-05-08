"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"
import { AuthProvider } from "@/contexts/auth-context"
import { AdminDataProvider } from "@/contexts/admin-data-context"
import { BookingProvider } from "@/contexts/booking-context"

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <SessionProvider>
        <AuthProvider>
          <AdminDataProvider>
            <BookingProvider>
              {children}
              <Toaster richColors position="top-center" />
            </BookingProvider>
          </AdminDataProvider>
        </AuthProvider>
      </SessionProvider>
    </NextThemesProvider>
  )
}
