"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Building2, Calendar, Clock, User, Settings, LogOut, Bell, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Building2 },
  { name: "Book Resource", href: "/book", icon: Calendar },
  { name: "My Bookings", href: "/bookings", icon: Clock },
  { name: "Profile", href: "/profile", icon: User },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<
    { id: string; title: string; message: string; createdAt: string; isRead: boolean }[]
  >([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const { user, logout } = useAuth()

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications])

  const handleLogout = async () => {
    await logout()
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (!user) return null

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoadingNotifications(true)
      try {
        const res = await fetch("/api/notifications")
        if (!res.ok) return
        const data = await res.json()
        if (alive && Array.isArray(data)) {
          setNotifications(
            data.map((n: any) => ({
              id: String(n.id),
              title: String(n.title ?? "Notification"),
              message: String(n.message ?? ""),
              createdAt: String(n.createdAt ?? new Date().toISOString()),
              isRead: Boolean(n.isRead),
            })),
          )
        }
      } finally {
        if (alive) setLoadingNotifications(false)
      }
    }
    void load()
    const i = setInterval(() => void load(), 30_000)
    return () => {
      alive = false
      clearInterval(i)
    }
  }, [])

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    await fetch(`/api/notifications/${id}`, { method: "PATCH" })
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-orange-500" />
              <span className="text-xl font-bold text-orange-600">The Hive</span>
            </Link>
          </div> */}
          

<div className="flex items-center">
  <Link href="/" className="flex items-center space-x-2">
    <img src="/favicon-removebg-preview (1).png" alt="The Hive Logo" className="h-9 w-auto" />


    {/* <Building2 className="h-8 w-8 text-orange-500" /> */}
  </Link>
</div>


          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-orange-100 text-orange-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="px-2 py-1.5 text-sm font-medium">Notifications</div>
                <DropdownMenuSeparator />
                {loadingNotifications && <div className="px-2 py-2 text-sm text-muted-foreground">Loading...</div>}
                {!loadingNotifications && notifications.length === 0 && (
                  <div className="px-2 py-2 text-sm text-muted-foreground">No notifications</div>
                )}
                {!loadingNotifications &&
                  notifications.slice(0, 8).map((n) => (
                    <DropdownMenuItem key={n.id} onClick={() => void markRead(n.id)} className="py-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{n.title}</span>
                          {!n.isRead && <span className="h-2 w-2 rounded-full bg-orange-500 inline-block" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                {user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium",
                      pathname === item.href
                        ? "bg-orange-100 text-orange-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
