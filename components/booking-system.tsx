"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Phone, Monitor, ArrowLeft, Clock, MapPin, CheckCircle, AlertCircle } from "lucide-react"
import { Navigation } from "./navigation"
import { useBookings } from "@/contexts/booking-context"
import { BookingDebug } from "./booking-debug"
import { formatDateForStorage, isToday, timeToMinutes } from "@/lib/date-utils"

const resources = {
  "meeting-room": [
    {
      id: 1,
      name: "Conference Room A",
      capacity: 12,
      amenities: ["Projector", "Whiteboard", "Video Conferencing"],
      available: true,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 2,
      name: "Huddle Room B",
      capacity: 6,
      amenities: ["TV Screen", "Whiteboard"],
      available: true,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 3,
      name: "Executive Boardroom",
      capacity: 16,
      amenities: ["Projector", "Video Conferencing", "Coffee Station"],
      available: true,
      image: "/placeholder.svg?height=200&width=300",
    },
  ],
  "phone-booth": [
    {
      id: 4,
      name: "Phone Booth 1",
      capacity: 1,
      amenities: ["Soundproof", "Power Outlet"],
      available: true,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 5,
      name: "Phone Booth 2",
      capacity: 1,
      amenities: ["Soundproof", "Power Outlet", "USB Charging"],
      available: true,
      image: "/placeholder.svg?height=200&width=300",
    },
  ],
  resources: [
    {
      id: 6,
      name: "Portable Projector",
      capacity: 1,
      amenities: ["HDMI", "Wireless Connection"],
      available: true,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 7,
      name: "Mobile Whiteboard",
      capacity: 1,
      amenities: ["Wheels", "Markers Included"],
      available: true,
      image: "/placeholder.svg?height=200&width=300",
    },
  ],
}

const timeSlots = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
]

const durations = ["30 minutes", "1 hour", "1.5 hours", "2 hours", "3 hours", "4 hours"]

// Helper function to calculate end time
const calculateEndTime = (startTime: string, duration: string): string => {
  const startMinutes = timeToMinutes(startTime)

  let durationMinutes = 0
  if (duration.includes("hour")) {
    const hours = Number.parseFloat(duration.replace(/[^\d.]/g, ""))
    durationMinutes = hours * 60
  } else if (duration.includes("minute")) {
    durationMinutes = Number.parseInt(duration.replace(/[^\d]/g, ""))
  }

  const endMinutes = startMinutes + durationMinutes
  const endHours = Math.floor(endMinutes / 60)
  const endMins = endMinutes % 60

  const period = endHours >= 12 ? "PM" : "AM"
  const displayHours = endHours > 12 ? endHours - 12 : endHours === 0 ? 12 : endHours

  return `${displayHours}:${endMins.toString().padStart(2, "0")} ${period}`
}

export function BookingSystem() {
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedDuration, setSelectedDuration] = useState<string>("")
  const [purpose, setPurpose] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  const { addBooking, checkAvailability, bookings } = useBookings()
  const router = useRouter()

  const handleTypeSelect = (type: string) => {
    setSelectedType(type)
    setStep(2)
  }

  const handleResourceSelect = (resource: any) => {
    setSelectedResource(resource)
    setStep(3)
  }

  const handleBooking = async () => {
    if (!selectedResource || !selectedDate || !selectedTime || !selectedDuration) {
      setNotification({ type: "error", message: "Please fill in all required fields" })
      return
    }

    setIsLoading(true)

    try {
      const endTime = calculateEndTime(selectedTime, selectedDuration)
      // Use proper date formatting to avoid timezone issues
      const dateString = formatDateForStorage(selectedDate)

      console.log("Attempting to book:", {
        resource: selectedResource.name,
        resourceId: selectedResource.id,
        date: dateString,
        selectedDate: selectedDate,
        startTime: selectedTime,
        endTime: endTime,
        duration: selectedDuration,
      })

      const result = await addBooking({
        type:
          selectedType === "meeting-room"
            ? "Meeting Room"
            : selectedType === "phone-booth"
              ? "Phone Booth"
              : "Equipment",
        resource: selectedResource.name,
        resourceId: selectedResource.id,
        date: dateString,
        startTime: selectedTime,
        endTime: endTime,
        duration: selectedDuration,
        status: "confirmed",
        purpose: purpose || undefined,
        amenities: selectedResource.amenities,
        upcoming: true,
      })

      if (result.success) {
        setNotification({ type: "success", message: result.message })

        // Reset form after successful booking
        setTimeout(() => {
          setStep(1)
          setSelectedType("")
          setSelectedResource(null)
          setSelectedDate(undefined)
          setSelectedTime("")
          setSelectedDuration("")
          setPurpose("")
          setNotification(null)
          router.push("/dashboard")
        }, 2000)
      } else {
        setNotification({ type: "error", message: result.message })
      }
    } catch (error) {
      console.error("Booking error:", error)
      setNotification({ type: "error", message: "An error occurred while booking. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  // Check availability when date, time, or duration changes
  const endTime = selectedTime && selectedDuration ? calculateEndTime(selectedTime, selectedDuration) : ""
  const dateString = selectedDate ? formatDateForStorage(selectedDate) : ""
  const isTimeSlotAvailable =
    selectedResource && selectedDate && selectedTime && endTime
      ? checkAvailability(selectedResource.id, dateString, selectedTime, endTime)
      : true

  // Get existing bookings for the selected resource and date for debugging
  const existingBookings =
    selectedResource && selectedDate
      ? bookings.filter(
          (b) => b.resourceId === selectedResource.id && b.date === dateString && b.status !== "cancelled",
        )
      : []

  // Filter time slots based on selected date and current time
  const getFilteredTimeSlots = () => {
    if (!selectedDate || !isToday(formatDateForStorage(selectedDate))) {
      return timeSlots // All slots available if not today
    }

    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    return timeSlots.filter((slot) => {
      const slotMinutes = timeToMinutes(slot)
      // Allow slots that are at least 30 minutes from now to give buffer
      return slotMinutes >= currentMinutes + 30
    })
  }

  const filteredTimeSlots = getFilteredTimeSlots()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Toggle */}
        <div className="mb-4">
          <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
            {showDebug ? "Hide" : "Show"} Debug Info
          </Button>
        </div>

        {/* Notification */}
        {notification && (
          <div className="mb-6">
            <Alert variant={notification.type === "error" ? "destructive" : "default"}>
              {notification.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{notification.message}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            {step > 1 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Book a Resource</h1>
              <p className="text-gray-600 mt-2">Reserve meeting rooms, phone booths, and equipment</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < 3 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Resource Type */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleTypeSelect("meeting-room")}
            >
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Meeting Rooms</CardTitle>
                <CardDescription>Conference rooms and huddle spaces for team meetings</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{resources["meeting-room"].length} rooms available</Badge>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleTypeSelect("phone-booth")}
            >
              <CardHeader>
                <Phone className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Phone Booths</CardTitle>
                <CardDescription>Private soundproof spaces for calls and focused work</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{resources["phone-booth"].length} booths available</Badge>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleTypeSelect("resources")}
            >
              <CardHeader>
                <Monitor className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Equipment</CardTitle>
                <CardDescription>Projectors, whiteboards, and other shared resources</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{resources.resources.length} items available</Badge>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Select Specific Resource */}
        {step === 2 && selectedType && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources[selectedType as keyof typeof resources].map((resource) => (
              <Card
                key={resource.id}
                className={`cursor-pointer transition-all ${
                  resource.available ? "hover:shadow-lg" : "opacity-50 cursor-not-allowed"
                }`}
                onClick={() => resource.available && handleResourceSelect(resource)}
              >
                <div className="aspect-video bg-gray-100 rounded-t-lg">
                  <img
                    src={resource.image || "/placeholder.svg"}
                    alt={resource.name}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{resource.name}</CardTitle>
                    <Badge variant={resource.available ? "default" : "destructive"}>
                      {resource.available ? "Available" : "Booked"}
                    </Badge>
                  </div>
                  {resource.capacity > 1 && (
                    <CardDescription className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      Up to {resource.capacity} people
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {resource.amenities.map((amenity) => (
                      <Badge key={amenity} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 3: Select Date and Time */}
        {step === 3 && selectedResource && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Select Date & Time</CardTitle>
                <CardDescription>Choose when you'd like to book {selectedResource.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Date</Label>
                  <div className="mt-2">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => formatDateForStorage(date) < formatDateForStorage(new Date())}
                      className="rounded-md border"
                    />
                  </div>
                  {selectedDate && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {selectedDate.toDateString()} (stored as: {dateString})
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="time">Start Time</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTimeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration</Label>
                    <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map((duration) => (
                          <SelectItem key={duration} value={duration}>
                            {duration}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Availability Check */}
                {selectedDate && selectedTime && selectedDuration && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border">
                      {isTimeSlotAvailable ? (
                        <div className="flex items-center text-green-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            Available: {selectedTime} - {endTime}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-700">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm">This time slot is already booked</span>
                        </div>
                      )}
                    </div>

                    {/* Show existing bookings for this resource/date */}
                    {existingBookings.length > 0 && (
                      <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">
                          Existing bookings for {selectedResource.name} on {selectedDate.toDateString()}:
                        </h4>
                        <ul className="text-xs text-yellow-700 space-y-1">
                          {existingBookings.map((booking) => (
                            <li key={booking.id}>
                              {booking.startTime} - {booking.endTime} ({booking.status})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="purpose">Purpose (Optional)</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Brief description of your meeting or activity"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{selectedResource.name}</p>
                    <p className="text-sm text-gray-500">
                      {selectedResource.capacity > 1 ? `Up to ${selectedResource.capacity} people` : "Individual use"}
                    </p>
                  </div>
                </div>

                {selectedDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{selectedDate.toDateString()}</p>
                    </div>
                  </div>
                )}

                {selectedTime && selectedDuration && (
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {selectedTime} - {endTime}
                      </p>
                      <p className="text-sm text-gray-500">Duration: {selectedDuration}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Amenities Included:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedResource.amenities.map((amenity: string) => (
                      <Badge key={amenity} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full mt-6"
                  onClick={handleBooking}
                  disabled={!selectedDate || !selectedTime || !selectedDuration || !isTimeSlotAvailable || isLoading}
                >
                  {isLoading ? "Confirming..." : "Confirm Booking"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Debug Information */}
        {showDebug && <BookingDebug />}
      </main>
    </div>
  )
}
