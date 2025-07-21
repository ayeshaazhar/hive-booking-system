
"use client"
import React, { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Phone, Monitor, Calendar, Clock, MoreHorizontal } from "lucide-react"
import { useBooking } from "@/contexts/booking-context"
import { useAuth } from "@/contexts/auth-context"
import { formatDateForDisplay } from "@/lib/date-utils"
import type { Booking } from "@/contexts/booking-context"
import { Navigation } from "./navigation"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM"
]
const durations = ["30 minutes", "1 hour", "1.5 hours", "2 hours", "3 hours", "4 hours"]

function BookingEditDialog({ open, onOpenChange, booking, onSave }: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  booking: Booking,
  onSave: (updates: Partial<Booking>) => void
}) {
  const [date, setDate] = useState<string>(booking.startTime.split("T")[0])
  const [time, setTime] = useState<string>(() => {
    const d = new Date(booking.startTime)
    let h = d.getHours(), m = d.getMinutes()
    let ampm = h >= 12 ? "PM" : "AM"
    h = h % 12; if (h === 0) h = 12
    return `${h}:${m.toString().padStart(2, "0")} ${ampm}`
  })
  const [duration, setDuration] = useState<string>(() => {
    const start = new Date(booking.startTime)
    const end = new Date(booking.endTime)
    const diff = (end.getTime() - start.getTime()) / 60000
    if (diff === 30) return "30 minutes"
    if (diff === 60) return "1 hour"
    if (diff === 90) return "1.5 hours"
    if (diff === 120) return "2 hours"
    if (diff === 180) return "3 hours"
    if (diff === 240) return "4 hours"
    return `${diff} minutes`
  })
  const [purpose, setPurpose] = useState<string>(booking.purpose || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const { bookings } = useBooking()

  function hasConflict(newStart: Date, newEnd: Date) {
    return bookings.some(b =>
      b.id !== booking.id &&
      b.resourceId === booking.resourceId &&
      b.status !== "cancelled" &&
      newStart < new Date(b.endTime) &&
      newEnd > new Date(b.startTime)
    )
  }

  function handleSave() {
    setSaving(true)
    setError("")
    // Calculate new start and end time
    const [hstr, mstr] = time.split(":")
    let [h, m] = [parseInt(hstr), parseInt(mstr)]
    let ampm = time.includes("PM") ? "PM" : "AM"
    if (ampm === "PM" && h !== 12) h += 12
    if (ampm === "AM" && h === 12) h = 0
    const start = new Date(date)
    start.setHours(h, m, 0, 0)
    let durationMinutes = 0
    if (duration.includes("hour")) durationMinutes = Number.parseFloat(duration.replace(/[^\d.]/g, "")) * 60
    else if (duration.includes("minute")) durationMinutes = Number.parseInt(duration.replace(/[^\d]/g, ""))
    const end = new Date(start.getTime() + durationMinutes * 60000)
    if (hasConflict(start, end)) {
      setError("This time slot overlaps with another booking for this resource.")
      setSaving(false)
      return
    }
    let notes = booking.notes ? booking.notes : ""
    if (!notes.includes("edited")) notes = notes ? notes + ", edited" : "edited"
    onSave({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      purpose,
      notes
    })
    setSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>Change your booking details below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Start Time</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
              <SelectContent>
                {timeSlots.map(slot => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
              <SelectContent>
                {durations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Purpose</Label>
            <Textarea value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Purpose (optional)" />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function MyBookings() {
  const { user } = useAuth()
  const { bookings, isLoaded, updateBooking } = useBooking()
  const [activeTab, setActiveTab] = useState<string>("upcoming")
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null)
  const [editError, setEditError] = useState<string>("")

  const upcomingBookings = useMemo<Booking[]>(() => {
    const now = new Date()
    return bookings
      .filter(
        (booking: Booking) =>
          booking.userId === user?.id && new Date(booking.startTime) >= now && booking.status !== "cancelled",
      )
      .sort((a: Booking, b: Booking) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  }, [bookings, user])

  const pastBookings = useMemo<Booking[]>(() => {
    const now = new Date()
    return bookings
      .filter(
        (booking: Booking) =>
          booking.userId === user?.id &&
          new Date(booking.startTime) < now &&
          booking.status !== "cancelled",
      )
      .sort((a: Booking, b: Booking) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
  }, [bookings, user])

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

  const getIcon = (type: string) => {
    switch (type) {
      case "Meeting Room":
        return <Users className="h-5 w-5 text-blue-600" />
      case "Phone Booth":
        return <Phone className="h-5 w-5 text-green-600" />
      case "Equipment":
        return <Monitor className="h-5 w-5 text-purple-600" />
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

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card key={booking.id} className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">{getIcon(booking.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold">{booking.resource}</h3>
                <Badge variant={getStatusColor(booking.status)}>{booking.status}</Badge>
                {booking.notes && booking.notes.includes("edited") && !booking.notes.includes("cancelled") && (
                  <Badge variant="outline" className="ml-2 text-xs text-orange-600 border-orange-400">edited</Badge>
                )}
                {booking.notes && booking.notes.includes("cancelled") && (
                  <Badge variant="outline" className="ml-2 text-xs text-red-600 border-red-400">cancelled</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-2">{booking.type}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDateForDisplay(booking.startTime)}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(booking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(booking.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              {booking.purpose && (
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Purpose:</strong> {booking.purpose}
                </p>
              )}
            </div>
          </div>
          {/* 3-dots dropdown for actions */}
          {(booking.status !== "cancelled" && booking.status !== "completed") && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full hover:bg-gray-100 focus:outline-none">
                    <MoreHorizontal className="h-5 w-5 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setEditDialogOpen(booking.id)}
                  >
                    Edit Booking
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateBooking(booking.id, { status: "cancelled", notes: "cancelled" })}
                    className="text-red-600 focus:text-red-700"
                  >
                    Cancel Booking
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <BookingEditDialog
                open={editDialogOpen === booking.id}
                onOpenChange={open => setEditDialogOpen(open ? booking.id : null)}
                booking={booking}
                onSave={updates => updateBooking(booking.id, updates)}
              />
            </>
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
                  <p className="text-gray-500 mb-4">You don&apos;t have any upcoming reservations.</p>
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
