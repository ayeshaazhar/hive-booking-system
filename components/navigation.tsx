"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Calendar, Users, Settings, LogOut, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function Navigation() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { user } = useAuth() // Get user from auth context

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Book", href: "/book", icon: Calendar },
    { name: "My Bookings", href: "/bookings", icon: Home },
    { name: "Profile", href: "/profile", icon: Users },
  ]

  // Add Admin link only if user is an admin
  if (user?.role === "admin") {
    navItems.push({ name: "Admin", href: "/admin", icon: Settings })
  }

  // Show a loading state or nothing if session is not yet loaded
  if (status === "loading") {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center space-x-4">
            <div className="h-6 w-6 animate-pulse rounded-full bg-gray-300" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-300" />
          </div>
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-300" />
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <nav className="flex items-center space-x-4 lg:space-x-6">
          <Link href="/" className="text-lg font-bold">
            Hive
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="flex items-center space-x-4">
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={session.user.image || "/placeholder-user.jpg"}
                      alt={session.user.name || "User"}
                    />
                    <AvatarFallback>{session.user.name ? session.user.name[0] : "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
