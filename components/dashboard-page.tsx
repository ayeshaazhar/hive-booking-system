"use client"

import React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useBooking } from "@/contexts/booking-context"
import { useAdminData } from "@/contexts/admin-data-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Phone, Users, Clock, Plus, Monitor } from "lucide-react"
import Link from "next/link"
import { Navigation } from "./navigation"
import { formatDateForDisplay, isToday } from "@/lib/date-utils"

// Map resource type to icon and label
const resourceCategories: {
  key: string;
  label: string;
  icon: React.ReactElement;
  description: string;
  color: string;
  linkType: string;
}[] = [
  {
    key: "meeting_room",
    label: "Meeting Rooms",
    icon: <Users className="h-8 w-8 text-blue-600" />,
    description: "Book conference and huddle rooms",
    color: "text-blue-600",
    linkType: "meeting-room",
  },
  {
    key: "phone_booth",
    label: "Phone Booths",
    icon: <Phone className="h-8 w-8 text-green-600" />,
    description: "Private spaces for calls",
    color: "text-green-600",
    linkType: "phone-booth",
  },
  {
    key: "equipment",
    label: "Resources",
    icon: <Calendar className="h-8 w-8 text-purple-600" />,
    description: "Projectors, whiteboards & more",
    color: "text-purple-600",
    linkType: "resources",
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const { bookings, isLoaded: bookingsLoaded } = useBooking()
  const { resources, isLoaded: resourcesLoaded } = useAdminData()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!bookingsLoaded || !resourcesLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-2">Loading dashboard...</span>
          </div>
        </main>
      </div>
    )
  }

  // Group resources by type
  const resourceTypes = Array.from(new Set(resources.map((r) => r.type)))

  // Calculate availability for each type
  const getAvailableCount = (type: string) => {
    const total = resources.filter((r) => r.type === type && r.status === "available").length
    // Count bookings for today that are currently active for this type
    const today = new Date()
    const currentHour = today.getHours()
    const activeBookings = bookings.filter(
      (booking) =>
        isToday(booking.startTime) &&
        booking.status === "confirmed" &&
        resources.find((r) => r.id === booking.resourceId)?.type === type &&
        currentHour >= 9 &&
        currentHour <= 18
    )
    return Math.max(0, total - activeBookings.length)
  }

  // Upcoming bookings for this user
  const upcomingBookings = bookings
    .filter(
      (booking) =>
        booking.memberId === user.id &&
        new Date(booking.startTime) >= new Date() &&
        booking.status !== "cancelled"
    )
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  const firstName = user.name.split(" ")[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {firstName}!</h1>
          <p className="text-gray-600 mt-2">Manage your bookings and reserve resources</p>
          <div className="mt-2">
            <Badge>{user.company}</Badge>
          </div>
        </div>

        {/* Quick Actions - always show all categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {resourceCategories.map((cat) => {
            const resourcesOfType = resources.filter((r) => r.type === cat.key)
            const availableCount = resourcesOfType.filter((r) => r.status === "available").length
            return (
              <Card key={cat.key} className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link href={`/book?type=${cat.linkType}`}>
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    {cat.icon}
                    <div className="ml-4">
                      <CardTitle className="text-lg">{cat.label}</CardTitle>
                      <CardDescription>{cat.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{availableCount} available now</span>
                      <Button><Plus className="h-4 w-4 mr-1" />Book Now</Button>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            )
          })}
        </div>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />Upcoming Bookings
              </CardTitle>
              <CardDescription>Your next reservations ({upcomingBookings.length})</CardDescription>
            </div>
            <Link href="/bookings">
              <Button>View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.slice(0, 3).map((booking) => {
                  const resource = resources.find((r) => r.id === booking.resourceId)
                  const cat = resourceCategories.find((c) => resource && resource.type === c.key)
                  let icon: React.ReactElement = <Calendar className="h-8 w-8 text-gray-600" />
                  let label = booking.type
                  if (cat) {
                    icon = cat.icon
                    label = cat.label
                  }
                  return (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">{icon}</div>
                        <div>
                          <h4 className="font-medium">{resource?.name || booking.resource}</h4>
                          <p className="text-sm text-gray-500">{label}</p>
                          {booking.purpose && <p className="text-xs text-gray-400">{booking.purpose}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {isToday(booking.startTime) ? "Today" : formatDateForDisplay(booking.startTime)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                          {new Date(booking.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <Badge>{booking.status}</Badge>
                    </div>
                  )
                })}
                {upcomingBookings.length > 3 && (
                  <div className="text-center pt-4">
                    <Link href="/bookings">
                      <Button>View {upcomingBookings.length - 3} more bookings</Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming bookings</h3>
                <p className="text-gray-500 mb-4">You don&apos;t have any upcoming reservations.</p>
                <Link href="/book">
                  <Button><Plus className="h-4 w-4 mr-2" />Book a Resource</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
