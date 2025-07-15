"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useAdminData, type Member, type Resource } from "./admin-data-context"

export interface Booking {
  id: string
  resourceId: string
  memberId: string
  startTime: string // ISO string
  endTime: string // ISO string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  notes?: string
}

interface BookingContextType {
  bookings: Booking[]
  addBooking: (booking: Omit<Booking, "id" | "status">) => void
  updateBooking: (id: string, updates: Partial<Booking>) => void
  deleteBooking: (id: string) => void
  getBookingDetails: (booking: Booking) => {
    resource: Resource | undefined
    member: Member | undefined
  }
  isLoaded: boolean
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

const initialBookings: Booking[] = [
  {
    id: "book-1",
    resourceId: "res-1",
    memberId: "mem-1",
    startTime: "2024-07-20T09:00:00Z",
    endTime: "2024-07-20T10:00:00Z",
    status: "confirmed",
    notes: "Team meeting",
  },
  {
    id: "book-2",
    resourceId: "res-2",
    memberId: "mem-2",
    startTime: "2024-07-20T11:00:00Z",
    endTime: "2024-07-20T11:30:00Z",
    status: "pending",
    notes: "Client call",
  },
  {
    id: "book-3",
    resourceId: "res-1",
    memberId: "admin-1",
    startTime: "2024-07-21T14:00:00Z",
    endTime: "2024-07-21T16:00:00Z",
    status: "completed",
    notes: "Project review",
  },
]

export function BookingProvider({ children }: { children: ReactNode }) {
  const { members, resources, isLoaded: adminDataLoaded } = useAdminData()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!adminDataLoaded) return

    const storedBookings = localStorage.getItem("hive-bookings")
    if (storedBookings) {
      setBookings(JSON.parse(storedBookings))
    } else {
      setBookings(initialBookings)
    }
    setIsLoaded(true)
  }, [adminDataLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("hive-bookings", JSON.stringify(bookings))
    }
  }, [bookings, isLoaded])

  const addBooking = useCallback((newBookingData: Omit<Booking, "id" | "status">) => {
    setBookings((prev) => {
      const newBooking: Booking = {
        id: `book-${Date.now()}`,
        status: "pending", // Default status for new bookings
        ...newBookingData,
      }
      return [...prev, newBooking]
    })
  }, [])

  const updateBooking = useCallback((id: string, updates: Partial<Booking>) => {
    setBookings((prev) => prev.map((booking) => (booking.id === id ? { ...booking, ...updates } : booking)))
  }, [])

  const deleteBooking = useCallback((id: string) => {
    setBookings((prev) => prev.filter((booking) => booking.id !== id))
  }, [])

  const getBookingDetails = useCallback(
    (booking: Booking) => {
      const resource = resources.find((res) => res.id === booking.resourceId)
      const member = members.find((mem) => mem.id === booking.memberId)
      return { resource, member }
    },
    [members, resources],
  )

  const value = React.useMemo(
    () => ({
      bookings,
      addBooking,
      updateBooking,
      deleteBooking,
      getBookingDetails,
      isLoaded,
    }),
    [bookings, addBooking, updateBooking, deleteBooking, getBookingDetails, isLoaded],
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBooking() {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider")
  }
  return context
}
