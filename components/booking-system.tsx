

"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Phone, Monitor, ArrowLeft, Clock, MapPin, CheckCircle, AlertCircle } from "lucide-react"
import { useBooking, type Booking } from "@/contexts/booking-context" // Import Booking type
import { useAdminData, type Resource as AdminResource } from "@/contexts/admin-data-context" // Import AdminResource type
import { BookingDebug } from "./booking-debug"
import { formatDateForStorage, timeToMinutes } from "@/lib/date-utils"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { useSearchParams } from "next/navigation"
import { Navigation } from "./navigation"

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

// Helper function to calculate end time for display
const calculateDisplayEndTime = (startTime: string, duration: string): string => {
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

  // Convert 24-hour to 12-hour format with AM/PM
  const period = endHours >= 12 ? "PM" : "AM"
  const displayHours = endHours > 12 ? endHours - 12 : endHours === 0 ? 12 : endHours === 24 ? 12 : endHours // Handle midnight (00:00 -> 12 AM, 24:00 -> 12 AM next day)

  return `${displayHours}:${endMins.toString().padStart(2, "0")} ${period}`
}

// Helper to map URL type to resource.type
const mapTypeToResourceType = (type: string) => {
  if (type === "meeting-room") return "meeting_room"
  if (type === "phone-booth") return "phone_booth"
  if (type === "resources") return "equipment"
  return type
}

export function BookingSystem() {
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedDuration, setSelectedDuration] = useState<string>("")
  const [purpose, setPurpose] = useState<string>("")
  // Remove unused state
  // const [isLoading, setIsLoading] = useState(false)
  // const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  // const [showDebug, setShowDebug] = useState(false)
  const [conflictError, setConflictError] = useState("");

  const { resources, isLoaded: resourcesLoaded } = useAdminData();
  const router = useRouter()

  const searchParams = useSearchParams();
  const typeFromUrl = searchParams.get("type");

  // Set type from URL on mount
  useEffect(() => {
    if (typeFromUrl && !selectedType) {
      setSelectedType(typeFromUrl);
    }
  }, [typeFromUrl, selectedType]);

  // Robust step logic
  useEffect(() => {
    if (!selectedType) setStep(1);
    else if (selectedType && !selectedResource) setStep(2);
    else if (selectedType && selectedResource) setStep(3);
  }, [selectedType, selectedResource]);

  const isDataLoaded = true // Assuming booking data loads with admin data or independently

  // Function to check if a time slot is available
  const checkTimeSlotAvailability = useCallback(
    (
      resourceId: string,
      date: Date | undefined,
      startTime: string,
      duration: string,
      allBookings: Booking[],
    ): boolean => {
      if (!date || !startTime || !duration) return false

      const newBookingStartMinutes = timeToMinutes(startTime)
      let durationMinutes = 0
      if (duration.includes("hour")) {
        durationMinutes = Number.parseFloat(duration.replace(/[^\d.]/g, "")) * 60
      } else if (duration.includes("minute")) {
        durationMinutes = Number.parseInt(duration.replace(/[^\d]/g, ""))
      }
      const newBookingEndMinutes = newBookingStartMinutes + durationMinutes

      const selectedDateString = formatDateForStorage(date)

      // Filter bookings for the same resource and date
      const conflictingBookings = allBookings.filter((booking) => {
        const bookingDateString = booking.startTime.split("T")[0] // Get date part from ISO string
        return (
          booking.resourceId === resourceId &&
          bookingDateString === selectedDateString &&
          (booking.status === "confirmed" || booking.status === "pending") // Only consider confirmed/pending bookings
        )
      })

      // Check for overlaps
      for (const existingBooking of conflictingBookings) {
        const existingStartMinutes = timeToMinutes(existingBooking.startTime.split("T")[1]) // Extract time part and convert
        const existingEndMinutes = timeToMinutes(existingBooking.endTime.split("T")[1]) // Extract time part and convert

        // Overlap conditions:
        // [newStart, newEnd] overlaps with [existingStart, existingEnd]
        // This simplified check covers most overlaps:
        const overlap = newBookingStartMinutes < existingEndMinutes && newBookingEndMinutes > existingStartMinutes

        if (overlap) {
          return false // Conflict found
        }
      }
      return true // No conflicts
    },
    [], // Dependencies for useCallback
  )

  const handleTypeSelect = (type: string) => {
    setSelectedType(type)
    setStep(2)
  }

  const handleResourceSelect = (resource: any) => {
    setSelectedResource(resource)
    setStep(3)
  }

  const { addBooking, bookings } = useBooking();
  const { user } = useAuth();

  const hasConflict = useMemo(() => {
    if (!selectedDate || !selectedTime || !selectedDuration || !selectedResource) return false;
    // Convert selectedTime (e.g., "9:00 AM") to 24-hour format for easier Date object creation
    const [timePart, ampmPart] = selectedTime.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (ampmPart === "PM" && hours !== 12) hours += 12;
    if (ampmPart === "AM" && hours === 12) hours = 0;
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(hours, minutes, 0, 0);
    // Calculate end time in minutes from start of day
    const startMinutesOfDay = hours * 60 + minutes;
    let durationMinutes = 0;
    if (selectedDuration.includes("hour")) {
      durationMinutes = Number.parseFloat(selectedDuration.replace(/[^\d.]/g, "")) * 60;
    } else if (selectedDuration.includes("minute")) {
      durationMinutes = Number.parseInt(selectedDuration.replace(/[^\d]/g, ""));
    }
    const endMinutesOfDay = startMinutesOfDay + durationMinutes;
    const endDateTime = new Date(selectedDate);
    endDateTime.setHours(Math.floor(endMinutesOfDay / 60), endMinutesOfDay % 60, 0, 0);
    if (endDateTime < startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }
    const newStart = startDateTime.getTime();
    const newEnd = endDateTime.getTime();
    const selectedDateString = startDateTime.toISOString().split("T")[0];
    return bookings.some(b =>
      b.resourceId === selectedResource.id &&
      b.status !== "cancelled" &&
      b.startTime.split("T")[0] === selectedDateString &&
      newStart < new Date(b.endTime).getTime() &&
      newEnd > new Date(b.startTime).getTime()
    );
  }, [selectedDate, selectedTime, selectedDuration, selectedResource, bookings]);

  useEffect(() => {
    if (hasConflict) {
      setConflictError("This resource is already booked for the selected time slot.");
    } else {
      setConflictError("");
    }
  }, [hasConflict]);

  const handleBooking = () => {
    if (!selectedDate || !selectedTime || !selectedDuration || !selectedResource || !user) {
      alert("Please select a date, time, duration, and resource.");
      return;
    }
    if (hasConflict) {
      return;
    }
    // Convert selectedTime (e.g., "9:00 AM") to 24-hour format for easier Date object creation
    const [timePart, ampmPart] = selectedTime.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (ampmPart === "PM" && hours !== 12) hours += 12;
    if (ampmPart === "AM" && hours === 12) hours = 0;
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(hours, minutes, 0, 0);
    // Calculate end time in minutes from start of day
    const startMinutesOfDay = hours * 60 + minutes;
    let durationMinutes = 0;
    if (selectedDuration.includes("hour")) {
      durationMinutes = Number.parseFloat(selectedDuration.replace(/[^\d.]/g, "")) * 60;
    } else if (selectedDuration.includes("minute")) {
      durationMinutes = Number.parseInt(selectedDuration.replace(/[^\d]/g, ""));
    }
    const endMinutesOfDay = startMinutesOfDay + durationMinutes;
    const endDateTime = new Date(selectedDate);
    endDateTime.setHours(Math.floor(endMinutesOfDay / 60), endMinutesOfDay % 60, 0, 0);
    // Handle bookings that cross midnight
    if (endDateTime < startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }
    addBooking({
      type: selectedType === "meeting-room" ? "Meeting Room" : selectedType === "phone-booth" ? "Phone Booth" : "Equipment",
      resource: selectedResource.name,
      resourceId: selectedResource.id,
      memberId: user.id,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      purpose: purpose || undefined,
      status: "confirmed",
    });
    alert("Booking confirmed!");
    setStep(1);
    setSelectedType("");
    setSelectedResource(null);
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedDuration("");
    setPurpose("");
  }

  // Calculate display end time for the summary
  const displayEndTime = selectedTime && selectedDuration ? calculateDisplayEndTime(selectedTime, selectedDuration) : ""

  // Determine if the selected time slot is available
  const isTimeSlotAvailable = useMemo(() => {
    if (!selectedResource || !selectedDate || !selectedTime || !selectedDuration) return false
    return checkTimeSlotAvailability(selectedResource.id, selectedDate, selectedTime, selectedDuration, [])
  }, [selectedResource, selectedDate, selectedTime, selectedDuration, checkTimeSlotAvailability])

  // Filter time slots so that for today, only future slots (at least 30 minutes from now) are available
  const getFilteredTimeSlots = () => {
    if (!selectedDate) return timeSlots;
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    if (!isToday) return timeSlots;
    const currentMinutes = today.getHours() * 60 + today.getMinutes();
    return timeSlots.filter((slot) => {
      const [time, period] = slot.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      const slotMinutes = hours * 60 + minutes;
      return slotMinutes >= currentMinutes + 30;
    });
  };
  const filteredTimeSlots = getFilteredTimeSlots();

  // Group resources by type for selection
  const groupedResources = useMemo(() => {
    const groups: Record<string, AdminResource[]> = {};
    for (const res of resources) {
      if (!groups[res.type]) groups[res.type] = [];
      groups[res.type].push(res);
    }
    return groups;
  }, [resources]);

  // Type guard for Resource (from context)
  function isRealResource(res: any): res is import("@/contexts/admin-data-context").Resource {
    return typeof res.status === "string" && typeof res.location === "string"
  }
  // Type guard for fallback resource
  function isFallbackResource(res: any): res is { id: number; name: string; capacity: number; amenities: string[]; available: boolean; image: string } {
    return typeof res.available === "boolean" && Array.isArray(res.amenities)
  }

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Loading data...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <Badge>{resourcesLoaded ? groupedResources["meeting_room"]?.length || 0 : "Loading..."} rooms available</Badge>
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
                <Badge>{resourcesLoaded ? groupedResources["phone_booth"]?.length || 0 : "Loading..."} booths available</Badge>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleTypeSelect("equipment")}
            >
              <CardHeader>
                <Monitor className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Equipment</CardTitle>
                <CardDescription>Projectors, whiteboards, and other shared resources</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge>{resourcesLoaded ? groupedResources["equipment"]?.length || 0 : "Loading..."} items available</Badge>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Step 2: Select Specific Resource */}
        {step === 2 && selectedType && (
          (groupedResources[mapTypeToResourceType(selectedType)] && groupedResources[mapTypeToResourceType(selectedType)].length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(groupedResources[mapTypeToResourceType(selectedType)] as AdminResource[]).map((resource) => (
                <Card
                  key={resource.id}
                  className={`cursor-pointer transition-all ${resource.status === 'available' ? 'hover:shadow-lg' : 'opacity-50 cursor-not-allowed'}`}
                  onClick={() => resource.status === 'available' && handleResourceSelect(resource)}
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
                      <Badge variant={resource.status === 'available' ? 'default' : 'destructive'}>
                        {resource.status === 'available'
                          ? 'Available'
                          : resource.status
                            ? resource.status.charAt(0).toUpperCase() + resource.status.slice(1)
                            : 'Unknown'}
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
                      {Array.isArray(resource.amenities) && resource.amenities.length > 0 ? (
                        resource.amenities.map((amenity: string) => (
                          <Badge key={amenity} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No amenities listed</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div>No resources available for this type.</div>
          )
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
                    <p className="text-sm text-gray-600 mt-2">Selected: {selectedDate.toDateString()}</p>
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
                        {filteredTimeSlots.length > 0 ? (
                          filteredTimeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-slots" disabled>
                            No available slots
                          </SelectItem>
                        )}
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
                        {durations.length > 0 ? (
                          durations.map((duration) => (
                            <SelectItem key={duration} value={duration}>
                              {duration}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-duration" disabled>
                            No durations available
                          </SelectItem>
                        )}
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
                            Available: {selectedTime} - {displayEndTime}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-700">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm">This time slot is already booked or invalid.</span>
                        </div>
                      )}
                    </div>
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
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
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
                        {selectedTime} - {displayEndTime}
                      </p>
                      <p className="text-sm text-gray-500">Duration: {selectedDuration}</p>
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Details:</h4>
                  <div className="flex flex-wrap gap-2">
                    {isRealResource(selectedResource) && selectedResource.description && (
                      <Badge variant="outline" className="text-xs">
                        {selectedResource.description}
                      </Badge>
                    )}
                    {isFallbackResource(selectedResource) && selectedResource.amenities && selectedResource.amenities.map((amenity: string) => (
                      <Badge key={amenity} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-xs">
                      Location: {isRealResource(selectedResource) ? selectedResource.location : "N/A"}
                    </Badge>
                  </div>
                </div>
                {conflictError && (
                  <div className="text-red-600 text-sm mt-2">{conflictError}</div>
                )}
                <Button
                  className="w-full mt-6"
                  onClick={handleBooking}
                  disabled={!selectedDate || !selectedTime || !selectedDuration || hasConflict}
                >
                  Confirm Booking
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Debug Information */}
        {/* <BookingDebug /> */}
      </main>
    </div>
  )
}
