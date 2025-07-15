"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Users, Phone, Monitor, Calendar, Clock, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Navigation } from "./navigation"
import { useBookings } from "@/contexts/booking-context"
import { useAuth } from "@/contexts/auth-context"
import { formatDateForDisplay } from "@/lib/date-utils"

export function MyBookings() {
  const [activeTab, setActiveTab] = useState("upcoming")
  const { user } = useAuth()
  const { getUpcomingBookings, getPastBookings, cancelBooking, isLoaded } = useBookings()

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
            <span className="ml-2">Loading bookings...</span>
          </div>
        </main>
      </div>
    )
  }

  const upcomingBookings = getUpcomingBookings(user.id)
  const pastBookings = getPastBookings(user.id)

  const getIcon = (type: string) => {
    switch (type) {
      case "Meeting Room":
        return <Users className="h-5 w-5 text-blue-600" />
      case "Phone Booth":
        return <Phone className="h-5 w-5 text-green-600" />
      default:
        return <Monitor className="h-5 w-5 text-purple-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default"
      case "pending":
        return "secondary"
      case "cancelled":
        return "destructive"
      case "completed":
        return "outline"
      default:
        return "secondary"
    }
  }

  const handleEdit = (bookingId: string) => {
    console.log("Edit booking:", bookingId)
    // You can implement edit functionality later
    alert("Edit functionality coming soon!")
  }

  const handleCancel = (bookingId: string) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      cancelBooking(bookingId)
    }
  }

  const BookingCard = ({ booking }: { booking: any }) => (
    <Card key={booking.id} className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">{getIcon(booking.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold">{booking.resource}</h3>
                <Badge variant={getStatusColor(booking.status)}>{booking.status}</Badge>
              </div>
              <p className="text-sm text-gray-500 mb-2">{booking.type}</p>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDateForDisplay(booking.date)}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {booking.startTime} - {booking.endTime}
                </div>
              </div>

              {booking.purpose && (
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Purpose:</strong> {booking.purpose}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {booking.amenities.map((amenity: string) => (
                  <Badge key={amenity} variant="outline" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {booking.upcoming && booking.status !== "cancelled" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(booking.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Booking
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCancel(booking.id)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cancel Booking
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">Manage your current and past reservations</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
            <TabsTrigger value="history">History ({pastBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {upcomingBookings.length > 0 ? (
              <div>
                {upcomingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming bookings</h3>
                  <p className="text-gray-500 mb-4">You don't have any upcoming reservations.</p>
                  <Button>Book a Resource</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {pastBookings.length > 0 ? (
              <div>
                {pastBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No booking history</h3>
                  <p className="text-gray-500">Your past bookings will appear here.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
