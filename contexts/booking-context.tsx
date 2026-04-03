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

/** Fields the API accepts when creating a booking (no nested objects). */
export type CreateBookingInput = {
  resourceId: string
  startTime: string
  endTime: string
  status?: Booking["status"]
  purpose?: string
  notes?: string
}

function typeKeyToLabel(typeKey: string | undefined): string {
  if (!typeKey) return ""
  switch (typeKey) {
    case "meeting_room":
      return "Meeting Room"
    case "phone_booth":
      return "Phone Booth"
    case "equipment":
      return "Equipment"
    default:
      return typeKey
  }
}

function normalizeApiBooking(raw: Record<string, unknown>, resources: Resource[]): Booking {
  const resourceId = String(raw.resourceId ?? "")
  const meta = resources.find((r) => r.id === resourceId)
  const rel = raw.resource as { name?: string; type?: string } | string | undefined
  const relObj = rel && typeof rel === "object" ? rel : undefined
  const typeKey = meta?.type ?? relObj?.type
  const resourceName = meta?.name ?? relObj?.name ?? ""

  const start = raw.startTime
  const end = raw.endTime
  const startTime =
    typeof start === "string" ? start : start instanceof Date ? start.toISOString() : ""
  const endTime = typeof end === "string" ? end : end instanceof Date ? end.toISOString() : ""

  return {
    id: String(raw.id ?? ""),
    userId: String(raw.userId ?? ""),
    resourceId,
    startTime,
    endTime,
    status: raw.status as Booking["status"],
    notes: raw.notes != null ? String(raw.notes) : undefined,
    purpose: raw.purpose != null ? String(raw.purpose) : undefined,
    type: typeKeyToLabel(typeKey),
    resource: resourceName,
  }
}

interface BookingContextType {
  bookings: Booking[]
  addBooking: (booking: CreateBookingInput) => Promise<void>
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
    let cancelled = false

    const load = async () => {
      if (!adminDataLoaded || status === "loading") return

      if (status !== "authenticated" || !session?.user?.email) {
        if (!cancelled) {
          setBookings([])
          setIsLoaded(true)
        }
        return
      }

      try {
        const res = await fetch("/api/my-bookings")
        if (!res.ok) {
          if (!cancelled) {
            setBookings([])
            setIsLoaded(true)
          }
          return
        }
        const data = await res.json()
        if (cancelled) return
        const rows = Array.isArray(data) ? data : []
        setBookings(rows.map((b: Record<string, unknown>) => normalizeApiBooking(b, resources)))
      } catch (err) {
        console.error("Failed to load bookings:", err)
        if (!cancelled) setBookings([])
      } finally {
        if (!cancelled) setIsLoaded(true)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [session, status, adminDataLoaded, resources])

  const addBooking = useCallback(
    async (payload: CreateBookingInput) => {
      const res = await fetch("/api/my-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = typeof body.error === "string" ? body.error : "Failed to create booking"
        throw new Error(message)
      }
      setBookings((prev) => [...prev, normalizeApiBooking(body as Record<string, unknown>, resources)])
    },
    [resources],
  )

  const updateBooking = useCallback(
    async (id: string, updates: Partial<Booking>) => {
      const res = await fetch(`/api/my-bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = typeof body.error === "string" ? body.error : "Failed to update booking"
        throw new Error(message)
      }
      const normalized = normalizeApiBooking(body as Record<string, unknown>, resources)
      setBookings((prev) => prev.map((b) => (b.id === id ? normalized : b)))
    },
    [resources],
  )

  const deleteBooking = useCallback(async (id: string) => {
    const res = await fetch(`/api/my-bookings/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const message = typeof body.error === "string" ? body.error : "Failed to delete booking"
      throw new Error(message)
    }
    setBookings((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const getBookingDetails = useCallback(
    (booking: Booking) => {
      const resource = resources.find((res) => res.id === booking.resourceId)
      const member = members.find((mem) => mem.id === booking.userId)
      return { resource, member }
    },
    [members, resources],
  )

  const getUpcomingBookings = useCallback(
    (userId: string) => {
      const now = new Date()
      return bookings.filter(
        (booking) =>
          booking.userId === userId &&
          new Date(booking.endTime) > now &&
          booking.status !== "cancelled",
      )
    },
    [bookings],
  )

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
