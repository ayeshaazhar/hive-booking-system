"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useBookings } from "@/contexts/booking-context"
import { Loader2, CalendarIcon, History, Clock, XCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDateForDisplay } from "@/lib/date-utils"

export function MyBookings() {
  const { user } = useAuth()
  const { bookings, getUpcomingBookings, getPastBookings, cancelBooking, isLoaded } = useBookings()

  if (!user || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-2">Loading your bookings...</span>
      </div>
    )
  }

  const upcomingBookings = getUpcomingBookings(user.id)
  const pastBookings = getPastBookings(user.id)

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
          <CardDescription>View and manage your resource reservations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">
                <CalendarIcon className="mr-2 h-4 w-4" /> Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                <History className="mr-2 h-4 w-4" /> Past ({pastBookings.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="mt-4">
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4" />
                  <p>You have no upcoming bookings.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.resource}</TableCell>
                        <TableCell>{booking.type}</TableCell>
                        <TableCell>{formatDateForDisplay(booking.date)}</TableCell>
                        <TableCell>{`${booking.startTime} - ${booking.endTime}`}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{booking.purpose || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {booking.status === "confirmed" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to cancel this booking?")) {
                                  cancelBooking(booking.id)
                                }
                              }}
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            <TabsContent value="past" className="mt-4">
              {pastBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4" />
                  <p>You have no past bookings.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.resource}</TableCell>
                        <TableCell>{booking.type}</TableCell>
                        <TableCell>{formatDateForDisplay(booking.date)}</TableCell>
                        <TableCell>{`${booking.startTime} - ${booking.endTime}`}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{booking.purpose || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={booking.status === "cancelled" ? "destructive" : "outline"}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
