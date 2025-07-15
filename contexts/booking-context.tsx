"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "./auth-context"
import { formatDateForStorage, isToday, isFutureDate, isPastDate, timeToMinutes } from "@/lib/date-utils"

export interface Booking {
  id: string
  userId: string
  type: string
  resource: string
  resourceId: number
  date: string
  startTime: string
  endTime: string
  duration: string
  status: "confirmed" | "pending" | "cancelled" | "completed"
  purpose?: string
  amenities: string[]
  createdAt: string
  upcoming: boolean
}

interface BookingContextType {
  bookings: Booking[]
  addBooking: (booking: Omit<Booking, "id" | "userId" | "createdAt">) => Promise<{ success: boolean; message: string }>
  updateBooking: (id: string, updates: Partial<Booking>) => void
  cancelBooking: (id: string) => void
  getUserBookings: (userId: string) => Booking[]
  getUpcomingBookings: (userId: string) => Booking[]
  getPastBookings: (userId: string) => Booking[]
  checkAvailability: (resourceId: number, date: string, startTime: string, endTime: string) => boolean
  isLoaded: boolean
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

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

// Helper function to check if two time ranges overlap
const timesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const start1Minutes = timeToMinutes(start1)
  const end1Minutes = timeToMinutes(end1)
  const start2Minutes = timeToMinutes(start2)
  const end2Minutes = timeToMinutes(end2)

  // Two ranges overlap if one starts before the other ends
  // and the other starts before the first one ends
  return start1Minutes < end2Minutes && start2Minutes < end1Minutes
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load bookings from localStorage on mount
  useEffect(() => {
    const savedBookings = localStorage.getItem("hive-bookings")
    if (savedBookings) {
      try {
        const parsedBookings = JSON.parse(savedBookings)
        setBookings(parsedBookings)
        console.log("Loaded bookings from localStorage:", parsedBookings)
      } catch (error) {
        console.error("Error loading bookings from localStorage:", error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save bookings to localStorage whenever bookings change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("hive-bookings", JSON.stringify(bookings))
      console.log("Saved bookings to localStorage:", bookings)
    }
  }, [bookings, isLoaded])

  const checkAvailability = (resourceId: number, date: string, startTime: string, endTime: string): boolean => {
    console.log("Checking availability for:", { resourceId, date, startTime, endTime })

    // Filter bookings for the same resource and date that are not cancelled or completed
    const conflictingBookings = bookings.filter(
      (booking) =>
        booking.resourceId === resourceId &&
        booking.date === date &&
        booking.status !== "cancelled" &&
        booking.status !== "completed",
    )

    console.log("Found potentially conflicting bookings:", conflictingBookings)

    // Check if any of these bookings overlap with the requested time
    const hasConflict = conflictingBookings.some((booking) => {
      const overlap = timesOverlap(startTime, endTime, booking.startTime, booking.endTime)
      console.log(
        `Checking overlap between ${startTime}-${endTime} and ${booking.startTime}-${booking.endTime}:`,
        overlap,
      )
      return overlap
    })

    console.log("Has conflict:", hasConflict)
    return !hasConflict
  }

  const addBooking = async (
    bookingData: Omit<Booking, "id" | "userId" | "createdAt">,
  ): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: "User not authenticated" }
    }

    console.log("Adding booking:", bookingData)

    // Check availability
    const isAvailable = checkAvailability(
      bookingData.resourceId,
      bookingData.date,
      bookingData.startTime,
      bookingData.endTime,
    )

    if (!isAvailable) {
      return { success: false, message: "This resource is already booked for the selected time slot" }
    }

    const newBooking: Booking = {
      ...bookingData,
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
    }

    console.log("Creating new booking:", newBooking)
    setBookings((prev) => [...prev, newBooking])
    return { success: true, message: "Booking confirmed successfully!" }
  }

  const updateBooking = (id: string, updates: Partial<Booking>) => {
    setBookings((prev) => prev.map((booking) => (booking.id === id ? { ...booking, ...updates } : booking)))
  }

  const cancelBooking = (id: string) => {
    updateBooking(id, { status: "cancelled", upcoming: false })
  }

  const getUserBookings = (userId: string) => {
    return bookings.filter((booking) => booking.userId === userId)
  }

  const getUpcomingBookings = (userId: string) => {
    const now = new Date()
    const today = formatDateForStorage(now)
    const currentTime = now.getHours() * 60 + now.getMinutes()

    return bookings.filter((booking) => {
      if (booking.userId !== userId || booking.status === "cancelled") return false

      // If booking is in the future
      if (isFutureDate(booking.date)) return true

      // If booking is today, check if it's still upcoming
      if (isToday(booking.date)) {
        const bookingStartTime = timeToMinutes(booking.startTime)
        return bookingStartTime > currentTime
      }

      return false
    })
  }

  const getPastBookings = (userId: string) => {
    const now = new Date()
    const today = formatDateForStorage(now)
    const currentTime = now.getHours() * 60 + now.getMinutes()

    return bookings.filter((booking) => {
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
  }

  const value: BookingContextType = {
    bookings,
    addBooking,
    updateBooking,
    cancelBooking,
    getUserBookings,
    getUpcomingBookings,
    getPastBookings,
    checkAvailability,
    isLoaded,
  }

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBookings() {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error("useBookings must be used within a BookingProvider")
  }
  return context
}
