"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { timeToMinutes, isToday, isFutureDate, isPastDate } from "@/lib/date-utils"
import { useAuth } from "./auth-context" // Assuming useAuth is available

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed"

export interface Booking {
  id: string
  userId: string // ID of the user who made the booking
  resourceId: number // ID of the resource booked
  resource: string // Name of the resource
  type: string // Type of the resource (e.g., "Meeting Room", "Phone Booth")
  date: string // YYYY-MM-DD format
  startTime: string // HH:MM format (e.g., "09:00 AM")
  endTime: string // HH:MM format (e.g., "10:00 AM")
  duration: string // e.g., "1 hour", "30 minutes"
  purpose?: string
  amenities?: string[]
  status: BookingStatus
  createdAt: string // ISO string
}

interface BookingContextType {
  bookings: Booking[]
  addBooking: (booking: Omit<Booking, "id" | "status" | "createdAt">) => { success: boolean; message: string }
  updateBooking: (id: string, updates: Partial<Booking>) => void
  cancelBooking: (id: string) => void
  clearAllBookings: () => void // For debugging
  getBookingsForResourceAndDate: (resourceId: number, date: string) => Booking[]
  isTimeSlotAvailable: (
    resourceId: number,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string,
  ) => boolean
  getUserBookings: (userId: string) => Booking[]
  getUpcomingBookings: (userId: string) => Booking[]
  getPastBookings: (userId: string) => Booking[]
  isLoaded: boolean
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

export function BookingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load bookings from localStorage on mount
  useEffect(() => {
    console.log("BookingProvider: useEffect for loading data triggered")
    try {
      const savedBookings = localStorage.getItem("hive-bookings")
      if (savedBookings) {
        console.log("BookingProvider: Found saved bookings in localStorage")
        setBookings(JSON.parse(savedBookings))
      } else {
        console.log("BookingProvider: No saved bookings, initializing empty array")
      }
    } catch (error) {
      console.error("BookingProvider: Error loading bookings from localStorage:", error)
      setBookings([]) // Fallback to empty array in case of parsing error
    } finally {
      setIsLoaded(true)
      console.log("BookingProvider: Data loading complete, isLoaded set to true")
    }
  }, [])

  // Save bookings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      console.log("BookingProvider: useEffect for saving bookings triggered. Bookings:", bookings)
      localStorage.setItem("hive-bookings", JSON.stringify(bookings))
    }
  }, [bookings, isLoaded])

  const addBooking = (newBookingData: Omit<Booking, "id" | "status" | "createdAt">) => {
    console.log("BookingProvider: Attempting to add booking:", newBookingData)

    // Check for availability before adding
    if (
      !isTimeSlotAvailable(
        newBookingData.resourceId,
        newBookingData.date,
        newBookingData.startTime,
        newBookingData.endTime,
      )
    ) {
      console.warn("BookingProvider: Time slot not available for new booking.")
      return {
        success: false,
        message: "The selected time slot is already booked or overlaps with an existing booking.",
      }
    }

    const newBooking: Booking = {
      ...newBookingData,
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID
      status: "confirmed", // Default to confirmed for simplicity, can be 'pending'
      createdAt: new Date().toISOString(),
    }
    setBookings((prev) => [...prev, newBooking])
    console.log("BookingProvider: Booking added successfully:", newBooking)
    return { success: true, message: "Booking confirmed!" }
  }

  const updateBooking = (id: string, updates: Partial<Booking>) => {
    console.log("BookingProvider: Attempting to update booking:", id, updates)
    setBookings((prev) => prev.map((booking) => (booking.id === id ? { ...booking, ...updates } : booking)))
    console.log("BookingProvider: Booking updated:", id, updates)
  }

  const cancelBooking = (id: string) => {
    console.log("BookingProvider: Attempting to cancel booking:", id)
    setBookings((prev) => prev.map((booking) => (booking.id === id ? { ...booking, status: "cancelled" } : booking)))
    console.log("BookingProvider: Booking cancelled:", id)
  }

  const clearAllBookings = () => {
    console.warn("BookingProvider: Clearing all bookings!")
    setBookings([])
  }

  const getBookingsForResourceAndDate = (resourceId: number, date: string): Booking[] => {
    const filtered = bookings.filter(
      (booking) =>
        booking.resourceId === resourceId &&
        booking.date === date &&
        (booking.status === "confirmed" || booking.status === "pending"),
    )
    console.log(
      `BookingProvider: Found ${filtered.length} active bookings for resource ${resourceId} on ${date}.`,
      filtered,
    )
    return filtered
  }

  const isTimeSlotAvailable = (
    resourceId: number,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string,
  ): boolean => {
    console.log(
      `BookingProvider: Checking availability for resource ${resourceId} on ${date} from ${startTime} to ${endTime}. Exclude: ${excludeBookingId || "none"}`,
    )

    const newStartMinutes = timeToMinutes(startTime)
    const newEndMinutes = timeToMinutes(endTime)

    // Ensure end time is after start time
    if (newEndMinutes <= newStartMinutes) {
      console.warn("BookingProvider: Invalid time slot - End time is not after start time.")
      return false
    }

    const conflictingBookings = bookings.filter((existingBooking) => {
      // Exclude the booking being updated (if any)
      if (existingBooking.id === excludeBookingId) {
        return false
      }

      // Only consider active or pending bookings for the same resource and date
      const isActiveBooking = existingBooking.status === "confirmed" || existingBooking.status === "pending"
      const isSameResource = existingBooking.resourceId === resourceId
      const isSameDate = existingBooking.date === date

      if (!isActiveBooking || !isSameResource || !isSameDate) {
        return false
      }

      const existingStartMinutes = timeToMinutes(existingBooking.startTime)
      const existingEndMinutes = timeToMinutes(existingBooking.endTime)

      // Check for overlap:
      // (newStart < existingEnd AND newEnd > existingStart)
      const overlaps = newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes
      console.log(
        `  - Checking existing booking ${existingBooking.id} (${existingBooking.startTime}-${existingBooking.endTime}): Overlaps = ${overlaps}`,
      )
      return overlaps
    })

    const available = conflictingBookings.length === 0
    console.log(`BookingProvider: Time slot is available: ${available}`)
    return available
  }

  const getUserBookings = (userId: string) => {
    return bookings.filter((booking) => booking.userId === userId)
  }

  const getUpcomingBookings = (userId: string) => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    return bookings
      .filter((booking) => {
        if (booking.userId !== userId || booking.status === "cancelled") return false

        // If booking is in the future
        if (isFutureDate(booking.date)) return true

        // If booking is today, check if it's still upcoming
        if (isToday(booking.date)) {
          const bookingStartTime = timeToMinutes(booking.startTime)
          // Add a small buffer (e.g., 5 minutes) to current time to avoid issues with exact current minute
          return bookingStartTime >= currentTime - 5
        }

        return false
      })
      .sort((a, b) => {
        // Sort by date, then by start time
        const dateA = new Date(a.date + "T" + a.startTime.replace(" AM", "").replace(" PM", "") + ":00")
        const dateB = new Date(b.date + "T" + b.startTime.replace(" AM", "").replace(" PM", "") + ":00")
        return dateA.getTime() - dateB.getTime()
      })
  }

  const getPastBookings = (userId: string) => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    return bookings
      .filter((booking) => {
        if (booking.userId !== userId) return false

        // Cancelled bookings are always in the past
        if (booking.status === "cancelled" || booking.status === "completed") return true

        // If booking was in the past
        if (isPastDate(booking.date)) return true

        // If booking was today but already passed
        if (isToday(booking.date)) {
          const bookingEndTime = timeToMinutes(booking.endTime)
          return bookingEndTime <= currentTime
        }

        return false
      })
      .sort((a, b) => {
        // Sort by date descending, then by start time descending
        const dateA = new Date(a.date + "T" + a.startTime.replace(" AM", "").replace(" PM", "") + ":00")
        const dateB = new Date(b.date + "T" + b.startTime.replace(" AM", "").replace(" PM", "") + ":00")
        return dateB.getTime() - dateA.getTime()
      })
  }

  const value: BookingContextType = {
    bookings,
    addBooking,
    updateBooking,
    cancelBooking,
    clearAllBookings,
    getBookingsForResourceAndDate,
    isTimeSlotAvailable,
    getUserBookings,
    getUpcomingBookings,
    getPastBookings,
    isLoaded,
  }

  console.log("BookingProvider: Returning context value. isLoaded:", value.isLoaded, "Bookings count:", bookings.length)

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBookings() {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error("useBookings must be used within a BookingProvider")
  }
  return context
}
