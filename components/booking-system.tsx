"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { formatDateForDisplay } from "@/lib/date-utils" // Import formatDateForDisplay
import { members } from "@/data/members" // Import members

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useBookings } from "@/contexts/booking-context"
import { useAuth } from "@/contexts/auth-context"
import { useAdminData } from "@/contexts/admin-data-context"
import { formatDateForStorage, isToday, timeToMinutes } from "@/lib/date-utils"
import { BookingDebug } from "./booking-debug"

interface BookingSystemProps {
  initialResourceType?: string
}

export function BookingSystem({ initialResourceType }: BookingSystemProps) {
  const { user } = useAuth()
  const {
    bookings,
    addBooking,
    getBookingsForResourceAndDate,
    isTimeSlotAvailable,
    isLoaded: bookingsLoaded,
  } = useBookings()
  const { resources, isLoaded: adminDataLoaded } = useAdminData()

  const isDataLoaded = bookingsLoaded && adminDataLoaded

  const [selectedResourceType, setSelectedResourceType] = React.useState(initialResourceType || "defaultType") // Update default value
  const [selectedResource, setSelectedResource] = React.useState<number | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = React.useState<string>("9:00 AM") // Update default value
  const [duration, setDuration] = React.useState<string>("30 minutes")
  const [purpose, setPurpose] = React.useState<string>("")
  const [statusMessage, setStatusMessage] = React.useState<{ type: "success" | "error"; message: string } | null>(null)
  const [showDebug, setShowDebug] = React.useState(false)

  const availableResources = React.useMemo(() => {
    if (!isDataLoaded) return []
    return resources.filter(
      (r) => r.status === "available" && (selectedResourceType === "defaultType" || r.type === selectedResourceType),
    )
  }, [resources, selectedResourceType, isDataLoaded])

  const timeSlots = React.useMemo(() => {
    const slots = []
    for (let i = 9; i <= 17; i++) {
      // 9 AM to 5 PM
      slots.push(`${i}:00 AM`)
      if (i < 17) slots.push(`${i}:30 AM`)
    }
    // Adjust for PM
    for (let i = 12; i <= 17; i++) {
      if (i === 12) {
        slots[slots.indexOf("12:00 AM")] = "12:00 PM"
        if (slots.includes("12:30 AM")) slots[slots.indexOf("12:30 AM")] = "12:30 PM"
      } else {
        slots[slots.indexOf(`${i}:00 AM`)] = `${i}:00 PM`
        if (slots.includes(`${i}:30 AM`)) slots[slots.indexOf(`${i}:30 AM`)] = `${i}:30 PM`
      }
    }

    // Filter out past times if today's date is selected
    if (selectedDate && isToday(formatDateForStorage(selectedDate))) {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()

      return slots.filter((slot) => {
        const slotMinutes = timeToMinutes(slot)
        // Allow booking if slot is at least 30 minutes in the future
        return slotMinutes >= currentMinutes + 30
      })
    }
    return slots
  }, [selectedDate])

  const calculateEndTime = (start: string, dur: string): string => {
    if (!start || !dur) return ""
    const startMinutes = timeToMinutes(start)
    let durationMinutes = 0
    if (dur.includes("hour")) {
      durationMinutes = Number.parseFloat(dur.replace(/[^\d.]/g, "")) * 60
    } else if (dur.includes("minute")) {
      durationMinutes = Number.parseInt(dur.replace(/[^\d]/g, ""))
    }
    const endMinutes = startMinutes + durationMinutes
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60

    const period = endHours >= 12 ? "PM" : "AM"
    const displayHours = endHours > 12 ? endHours - 12 : endHours === 0 ? 12 : endHours

    return `${displayHours}:${endMins.toString().padStart(2, "0")} ${period}`
  }

  const currentEndTime = React.useMemo(() => {
    return calculateEndTime(startTime, duration)
  }, [startTime, duration])

  const existingBookingsForSelectedResourceAndDate = React.useMemo(() => {
    if (!selectedResource || !selectedDate) return []
    const formattedDate = formatDateForStorage(selectedDate)
    return getBookingsForResourceAndDate(selectedResource, formattedDate)
  }, [selectedResource, selectedDate, getBookingsForResourceAndDate, bookings]) // Add bookings to dependency array

  const handleBooking = () => {
    if (!user) {
      setStatusMessage({ type: "error", message: "You must be logged in to book a resource." })
      return
    }
    if (!selectedResource || !selectedDate || !startTime || !duration) {
      setStatusMessage({ type: "error", message: "Please fill all required fields." })
      return
    }

    const resourceObj = resources.find((r) => r.id === selectedResource)
    if (!resourceObj) {
      setStatusMessage({ type: "error", message: "Selected resource not found." })
      return
    }

    const formattedDate = formatDateForStorage(selectedDate)
    const endTime = calculateEndTime(startTime, duration)

    const result = addBooking({
      userId: user.id,
      resourceId: selectedResource,
      resource: resourceObj.name,
      type: resourceObj.type,
      date: formattedDate,
      startTime,
      endTime,
      duration,
      purpose,
      amenities: resourceObj.amenities,
    })

    setStatusMessage(result)
    if (result.success) {
      // Clear form on success
      setSelectedResource(null)
      setSelectedDate(undefined)
      setStartTime("9:00 AM") // Reset to default value
      setDuration("30 minutes")
      setPurpose("")
    }
  }

  React.useEffect(() => {
    if (initialResourceType) {
      setSelectedResourceType(initialResourceType)
    }
  }, [initialResourceType])

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-2">Loading booking system...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Book a Resource</CardTitle>
          <CardDescription>Select a resource, date, and time to make a reservation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {statusMessage && (
            <div
              className={cn(
                "p-3 rounded-md flex items-center gap-2",
                statusMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
              )}
            >
              {statusMessage.type === "success" ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              <span>{statusMessage.message}</span>
            </div>
          )}

          {/* Resource Type Selection */}
          <div>
            <label htmlFor="resource-type">Resource Type</label>
            <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
              <SelectTrigger id="resource-type" className="w-full">
                <SelectValue placeholder="Select a resource type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="defaultType">All Types</SelectItem>
                {Array.from(new Set(resources.map((r) => r.type))).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resource Selection */}
          <div>
            <label htmlFor="resource">Resource</label>
            <Select
              value={selectedResource?.toString() || ""}
              onValueChange={(value) => setSelectedResource(Number.parseInt(value))}
              disabled={availableResources.length === 0}
            >
              <SelectTrigger id="resource" className="w-full">
                <SelectValue placeholder="Select a resource" />
              </SelectTrigger>
              <SelectContent>
                {availableResources.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id.toString()}>
                    {resource.name} ({resource.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableResources.length === 0 && (
              <p className="text-sm text-red-500 mt-1">No available resources for this type.</p>
            )}
          </div>

          {/* Date Selection */}
          <div>
            <label htmlFor="date">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={(date) => formatDateForStorage(date) < formatDateForStorage(new Date())} // Only disable past dates
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-time">Start Time</label>
              <Select value={startTime} onValueChange={setStartTime} disabled={!selectedDate || !selectedResource}>
                <SelectTrigger id="start-time">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="duration">Duration</label>
              <Select value={duration} onValueChange={setDuration} disabled={!startTime}>
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30 minutes">30 minutes</SelectItem>
                  <SelectItem value="1 hour">1 hour</SelectItem>
                  <SelectItem value="1.5 hours">1.5 hours</SelectItem>
                  <SelectItem value="2 hours">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {startTime && duration && (
            <div className="text-sm text-muted-foreground">Estimated End Time: {currentEndTime}</div>
          )}

          {/* Availability Check & Existing Bookings */}
          {selectedResource && selectedDate && startTime && duration && (
            <div className="mt-4 p-3 border rounded-md bg-gray-50">
              <h4 className="font-medium mb-2">Availability & Conflicts:</h4>
              {isTimeSlotAvailable(selectedResource, formatDateForStorage(selectedDate), startTime, currentEndTime) ? (
                <p className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> This slot is available!
                </p>
              ) : (
                <p className="text-red-600 flex items-center gap-1">
                  <XCircle className="h-4 w-4" /> This slot is NOT available. It conflicts with an existing booking.
                </p>
              )}

              {existingBookingsForSelectedResourceAndDate.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">
                    Existing bookings for this resource on {formatDateForDisplay(formatDateForStorage(selectedDate))}:
                  </p>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    {existingBookingsForSelectedResourceAndDate.map((booking) => (
                      <li key={booking.id}>
                        {booking.startTime} - {booking.endTime} (by{" "}
                        {members.find((m) => m.id === booking.userId)?.name || "Unknown"})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Purpose */}
          <div>
            <label htmlFor="purpose">Purpose (Optional)</label>
            <Textarea
              id="purpose"
              placeholder="Briefly describe the purpose of your booking..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          <Button
            onClick={handleBooking}
            className="w-full"
            disabled={!user || !selectedResource || !selectedDate || !startTime || !duration}
          >
            Book Resource
          </Button>
        </CardContent>
      </Card>

      {/* Debug Toggle */}
      <div className="fixed bottom-4 right-4">
        <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
          {showDebug ? "Hide Debug" : "Show Debug"}
        </Button>
      </div>

      {showDebug && <BookingDebug />}
    </div>
  )
}
