"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useBookings } from "@/contexts/booking-context"
import { useAuth } from "@/contexts/auth-context"
import { useAdminData } from "@/contexts/admin-data-context"
import { formatDateForDisplay } from "@/lib/date-utils"

export function BookingDebug() {
  const { bookings, clearAllBookings, isLoaded: bookingsLoaded } = useBookings()
  const { user } = useAuth()
  const { members, resources, isLoaded: adminDataLoaded } = useAdminData()

  const isDataLoaded = bookingsLoaded && adminDataLoaded

  if (!isDataLoaded) {
    return (
      <Card className="fixed bottom-4 left-4 w-80 bg-white shadow-lg z-50">
        <CardHeader>
          <CardTitle className="text-lg">Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading debug data...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="fixed bottom-4 left-4 w-80 bg-white shadow-lg z-50">
      <CardHeader>
        <CardTitle className="text-lg">Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <div>
          <h3 className="font-semibold">User:</h3>
          <p>ID: {user?.id || "N/A"}</p>
          <p>Name: {user?.name || "N/A"}</p>
          <p>Email: {user?.email || "N/A"}</p>
          <p>Role: {user?.role || "N/A"}</p>
        </div>
        <div>
          <h3 className="font-semibold">Bookings ({bookings.length}):</h3>
          {bookings.length === 0 ? (
            <p>No bookings stored.</p>
          ) : (
            <ul className="list-disc pl-4 max-h-40 overflow-y-auto">
              {bookings.map((b) => (
                <li key={b.id}>
                  {b.resource} ({b.type}) on {formatDateForDisplay(b.date)} from {b.startTime} to {b.endTime} (Status:{" "}
                  {b.status})
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="font-semibold">Members ({members.length}):</h3>
          {members.length === 0 ? (
            <p>No members stored.</p>
          ) : (
            <ul className="list-disc pl-4 max-h-40 overflow-y-auto">
              {members.map((m) => (
                <li key={m.id}>
                  {m.name} ({m.status})
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="font-semibold">Resources ({resources.length}):</h3>
          {resources.length === 0 ? (
            <p>No resources stored.</p>
          ) : (
            <ul className="list-disc pl-4 max-h-40 overflow-y-auto">
              {resources.map((r) => (
                <li key={r.id}>
                  {r.name} ({r.type}, {r.status})
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button onClick={clearAllBookings} variant="destructive" size="sm" className="w-full mt-2">
          Clear All Bookings
        </Button>
      </CardContent>
    </Card>
  )
}
