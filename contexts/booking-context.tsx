"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { useSession } from "next-auth/react"
import { useAdminData, type Member, type Resource } from "./admin-data-context"

export interface Booking {
  id: string
  resourceId: string
  userId: string
  startTime: string
  endTime: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  notes?: string
  type: string
  resource: string
  purpose?: string
}

interface BookingContextType {
  bookings: Booking[]
  addBooking: (booking: Omit<Booking, "id">) => Promise<void>
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>
  deleteBooking: (id: string) => Promise<void>
  getBookingDetails: (booking: Booking) => {
    resource: Resource | undefined
    member: Member | undefined
  }
  isLoaded: boolean
  getUpcomingBookings: (userId: string) => Booking[]
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

export function BookingProvider({ children }: { children: ReactNode }) {
  const { members, resources, isLoaded: adminDataLoaded } = useAdminData()
  const { data: session, status } = useSession()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const fetchBookings = async () => {
      if (!session?.user?.email) return

      try {
        const res = await fetch("/api/my-bookings")
        let data = await res.json()
        // Enrich bookings with resource info for UI compatibility
        data = data.map((booking: any) => {
          const resource = resources.find((r) => r.id === booking.resourceId)
          return {
            ...booking,
            type: resource?.type
              ? resource.type === "meeting_room" ? "Meeting Room"
                : resource.type === "phone_booth" ? "Phone Booth"
                : resource.type === "equipment" ? "Equipment"
                : resource.type
              : "",
            resource: resource?.name || "",
          }
        })
        setBookings(data)
      } catch (err) {
        console.error("Failed to load bookings:", err)
      } finally {
        setIsLoaded(true)
      }
    }

    if (status === "authenticated" && adminDataLoaded) {
      fetchBookings()
    }
  }, [session, status, adminDataLoaded, resources])

  const addBooking = useCallback(async (newBookingData: Omit<Booking, "id">) => {
    try {
      const res = await fetch("/api/my-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBookingData),
      })
      const newBooking = await res.json()
      setBookings((prev) => [...prev, newBooking])
    } catch (err) {
      console.error("Failed to add booking", err)
    }
  }, [])

  const updateBooking = useCallback(async (id: string, updates: Partial<Booking>) => {
    try {
      const res = await fetch(`/api/my-bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      const updated = await res.json()
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)))
    } catch (err) {
      console.error("Failed to update booking", err)
    }
  }, [])

  const deleteBooking = useCallback(async (id: string) => {
    try {
      await fetch(`/api/my-bookings/${id}`, { method: "DELETE" })
      setBookings((prev) => prev.filter((b) => b.id !== id))
    } catch (err) {
      console.error("Failed to delete booking", err)
    }
  }, [])

  const getBookingDetails = useCallback(
    (booking: Booking) => {
      const resource = resources.find((res) => res.id === booking.resourceId)
      const member = members.find((mem) => mem.id === booking.userId)
      return { resource, member }
    },
    [members, resources],
  )

  const getUpcomingBookings = useCallback((userId: string) => {
    const now = new Date()
    return bookings.filter(
      (booking) =>
        booking.userId === userId &&
        new Date(booking.startTime) >= now &&
        booking.status !== "cancelled"
    )
  }, [bookings])

  const value = React.useMemo(
    () => ({
      bookings,
      addBooking,
      updateBooking,
      deleteBooking,
      getBookingDetails,
      isLoaded,
      getUpcomingBookings,
    }),
    [bookings, addBooking, updateBooking, deleteBooking, getBookingDetails, isLoaded, getUpcomingBookings],
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
