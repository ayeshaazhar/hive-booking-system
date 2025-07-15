"use client"

import { useAuth } from "@/contexts/auth-context"
import { useBookings } from "@/contexts/booking-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Phone, Users, Clock, Plus } from "lucide-react"
import Link from "next/link"
import { Navigation } from "./navigation"
import { formatDateForDisplay, isToday } from "@/lib/date-utils"

// Resource counts for availability display
const resourceCounts = {
  "meeting-room": 3,
  "phone-booth": 2,
  resources: 2,
}

export function DashboardPage() {
  const { user } = useAuth()
  const { getUpcomingBookings, bookings, isLoaded } = useBookings()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!isLoaded) {
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

  const upcomingBookings = getUpcomingBookings(user.id)
  const firstName = user.name.split(" ")[0]

  // Calculate availability based on current bookings
  const getAvailableCount = (type: string) => {
    const today = new Date()
    const currentHour = today.getHours()

    // Count bookings for today that are currently active
    const activeBookings = bookings.filter(
      (booking) =>
        isToday(booking.date) &&
        booking.status === "confirmed" &&
        booking.type.toLowerCase().includes(type.split("-")[0]) &&
        // Simple check if booking is currently active (you can make this more sophisticated)
        currentHour >= 9 &&
        currentHour <= 18,
    )

    return Math.max(0, resourceCounts[type as keyof typeof resourceCounts] - activeBookings.length)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {firstName}!</h1>
          <p className="text-gray-600 mt-2">Manage your bookings and reserve resources</p>
          <div className="mt-2">
            <Badge variant="secondary">{user.company}</Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/book?type=meeting-room">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <CardTitle className="text-lg">Meeting Rooms</CardTitle>
                  <CardDescription>Book conference and huddle rooms</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{getAvailableCount("meeting-room")} available now</span>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/book?type=phone-booth">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Phone className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <CardTitle className="text-lg">Phone Booths</CardTitle>
                  <CardDescription>Private spaces for calls</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{getAvailableCount("phone-booth")} available now</span>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/book?type=resources">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <CardTitle className="text-lg">Resources</CardTitle>
                  <CardDescription>Projectors, whiteboards & more</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{getAvailableCount("resources")} available</span>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Upcoming Bookings
              </CardTitle>
              <CardDescription>Your next reservations ({upcomingBookings.length})</CardDescription>
            </div>
            <Link href="/bookings">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {booking.type === "Meeting Room" ? (
                          <Users className="h-8 w-8 text-blue-600" />
                        ) : booking.type === "Phone Booth" ? (
                          <Phone className="h-8 w-8 text-green-600" />
                        ) : (
                          <Calendar className="h-8 w-8 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{booking.resource}</h4>
                        <p className="text-sm text-gray-500">{booking.type}</p>
                        {booking.purpose && <p className="text-xs text-gray-400">{booking.purpose}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {isToday(booking.date) ? "Today" : formatDateForDisplay(booking.date)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                    <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>{booking.status}</Badge>
                  </div>
                ))}
                {upcomingBookings.length > 3 && (
                  <div className="text-center pt-4">
                    <Link href="/bookings">
                      <Button variant="outline" size="sm">
                        View {upcomingBookings.length - 3} more bookings
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming bookings</h3>
                <p className="text-gray-500 mb-4">You don't have any upcoming reservations.</p>
                <Link href="/book">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Book a Resource
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
