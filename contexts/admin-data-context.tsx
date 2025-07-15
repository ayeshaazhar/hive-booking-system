"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useMemo } from "react"
import { useBookings } from "./booking-context"
import { formatDateForStorage, isToday, timeToMinutes } from "@/lib/date-utils"

export type MemberStatus = "active" | "inactive" | "pending"

export interface Member {
  id: string
  name: string
  email: string
  company: string
  status: MemberStatus
  createdAt: string
}

export type ResourceType = "Meeting Room" | "Phone Booth" | "Projector" | "Whiteboard" | "Other"
export type ResourceStatus = "available" | "in-use" | "maintenance"

export interface Resource {
  id: number
  name: string
  type: ResourceType
  capacity?: number
  amenities?: string[]
  status: ResourceStatus
  imageUrl?: string
  createdAt: string
}

interface AdminDataContextType {
  members: Member[]
  resources: Resource[]
  addMember: (member: Omit<Member, "id" | "createdAt">) => void
  updateMember: (id: string, updates: Partial<Member>) => void
  removeMember: (id: string) => void
  addResource: (resource: Omit<Resource, "id" | "createdAt">) => void
  updateResource: (id: number, updates: Partial<Resource>) => void
  removeResource: (id: number) => void
  getDashboardStats: () => {
    totalBookingsToday: number
    activeMembers: number
    roomUtilization: number
    availableResources: number
  }
  isLoaded: boolean
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined)

// Dummy Data for initial load if localStorage is empty
const initialMembers: Member[] = [
  {
    id: "user_1",
    name: "Alice Smith",
    email: "alice@example.com",
    company: "Acme Corp",
    status: "active",
    createdAt: "2023-01-15T10:00:00Z",
  },
  {
    id: "user_2",
    name: "Bob Johnson",
    email: "bob@example.com",
    company: "Globex Inc",
    status: "active",
    createdAt: "2023-02-20T11:30:00Z",
  },
  {
    id: "user_3",
    name: "Charlie Brown",
    email: "charlie@example.com",
    company: "Acme Corp",
    status: "inactive",
    createdAt: "2023-03-01T09:00:00Z",
  },
  {
    id: "user_4",
    name: "Diana Prince",
    email: "diana@example.com",
    company: "Wayne Enterprises",
    status: "pending",
    createdAt: "2024-07-10T14:00:00Z",
  },
]

const initialResources: Resource[] = [
  {
    id: 101,
    name: "Conference Room A",
    type: "Meeting Room",
    capacity: 10,
    amenities: ["Projector", "Whiteboard"],
    status: "available",
    imageUrl: "/placeholder.svg?height=100&width=100",
    createdAt: "2023-01-01T08:00:00Z",
  },
  {
    id: 102,
    name: "Huddle Room 1",
    type: "Meeting Room",
    capacity: 4,
    amenities: ["Monitor"],
    status: "available",
    imageUrl: "/placeholder.svg?height=100&width=100",
    createdAt: "2023-01-05T09:00:00Z",
  },
  {
    id: 201,
    name: "Phone Booth 1",
    type: "Phone Booth",
    capacity: 1,
    amenities: ["Soundproofing"],
    status: "available",
    imageUrl: "/placeholder.svg?height=100&width=100",
    createdAt: "2023-01-10T10:00:00Z",
  },
  {
    id: 301,
    name: "Portable Projector",
    type: "Projector",
    status: "available",
    imageUrl: "/placeholder.svg?height=100&width=100",
    createdAt: "2023-02-01T13:00:00Z",
  },
]

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const { bookings, isLoaded: bookingsLoaded } = useBookings()
  const [members, setMembers] = useState<Member[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    console.log("AdminDataProvider: useEffect for loading data triggered")
    try {
      const savedMembers = localStorage.getItem("hive-members")
      const savedResources = localStorage.getItem("hive-resources")

      if (savedMembers) {
        console.log("AdminDataProvider: Found saved members in localStorage")
        setMembers(JSON.parse(savedMembers))
      } else {
        console.log("AdminDataProvider: No saved members, initializing with dummy data")
        setMembers(initialMembers)
      }

      if (savedResources) {
        console.log("AdminDataProvider: Found saved resources in localStorage")
        setResources(JSON.parse(savedResources))
      } else {
        console.log("AdminDataProvider: No saved resources, initializing with dummy data")
        setResources(initialResources)
      }
    } catch (error) {
      console.error("AdminDataProvider: Error loading data from localStorage:", error)
      setMembers(initialMembers) // Fallback
      setResources(initialResources) // Fallback
    } finally {
      setIsLoaded(true)
      console.log("AdminDataProvider: Data loading complete, isLoaded set to true")
    }
  }, [])

  // Save members to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      console.log("AdminDataProvider: useEffect for saving members triggered. Members:", members)
      localStorage.setItem("hive-members", JSON.stringify(members))
    }
  }, [members, isLoaded])

  // Save resources to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      console.log("AdminDataProvider: useEffect for saving resources triggered. Resources:", resources)
      localStorage.setItem("hive-resources", JSON.stringify(resources))
    }
  }, [resources, isLoaded])

  const addMember = (memberData: Omit<Member, "id" | "createdAt">) => {
    const newMember: Member = {
      ...memberData,
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    setMembers((prev) => [...prev, newMember])
    console.log("AdminDataProvider: Member added:", newMember)
  }

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, ...updates } : member)))
    console.log("AdminDataProvider: Member updated:", id, updates)
  }

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id))
    console.log("AdminDataProvider: Member removed:", id)
  }

  const addResource = (resourceData: Omit<Resource, "id" | "createdAt">) => {
    const newResource: Resource = {
      ...resourceData,
      id: Date.now(), // Simple ID for now
      createdAt: new Date().toISOString(),
    }
    setResources((prev) => [...prev, newResource])
    console.log("AdminDataProvider: Resource added:", newResource)
  }

  const updateResource = (id: number, updates: Partial<Resource>) => {
    setResources((prev) => prev.map((resource) => (resource.id === id ? { ...resource, ...updates } : resource)))
    console.log("AdminDataProvider: Resource updated:", id, updates)
  }

  const removeResource = (id: number) => {
    setResources((prev) => prev.filter((resource) => resource.id !== id))
    console.log("AdminDataProvider: Resource removed:", id)
  }

  const getDashboardStats = useMemo(() => {
    return () => {
      if (!bookingsLoaded) {
        console.log("AdminDataProvider: getDashboardStats - Bookings not loaded yet.")
        return {
          totalBookingsToday: 0,
          activeMembers: 0,
          roomUtilization: 0,
          availableResources: 0,
        }
      }

      const today = formatDateForStorage(new Date())
      const currentHour = new Date().getHours()
      const currentMinutes = new Date().getMinutes()
      const currentTimeInMinutes = currentHour * 60 + currentMinutes

      const totalBookingsToday = bookings.filter(
        (booking) => isToday(booking.date) && booking.status === "confirmed",
      ).length

      const activeMembers = members.filter((member) => member.status === "active").length

      // Calculate room utilization for today
      let totalMeetingRoomHours = 0
      let bookedMeetingRoomHours = 0
      let totalPhoneBoothHours = 0
      let bookedPhoneBoothHours = 0

      const workingHoursStart = timeToMinutes("09:00 AM") // 9 AM
      const workingHoursEnd = timeToMinutes("05:00 PM") // 5 PM
      const totalWorkingMinutesPerDay = workingHoursEnd - workingHoursStart // 8 hours * 60 minutes = 480 minutes

      const meetingRooms = resources.filter((r) => r.type === "Meeting Room")
      const phoneBooths = resources.filter((r) => r.type === "Phone Booth")

      totalMeetingRoomHours = meetingRooms.length * (totalWorkingMinutesPerDay / 60)
      totalPhoneBoothHours = phoneBooths.length * (totalWorkingMinutesPerDay / 60)

      bookings.forEach((booking) => {
        if (isToday(booking.date) && booking.status === "confirmed") {
          const bookingStartMinutes = timeToMinutes(booking.startTime)
          const bookingEndMinutes = timeToMinutes(booking.endTime)
          const durationMinutes = bookingEndMinutes - bookingStartMinutes

          if (booking.type === "Meeting Room") {
            bookedMeetingRoomHours += durationMinutes / 60
          } else if (booking.type === "Phone Booth") {
            bookedPhoneBoothHours += durationMinutes / 60
          }
        }
      })

      const meetingRoomUtilization =
        totalMeetingRoomHours > 0 ? (bookedMeetingRoomHours / totalMeetingRoomHours) * 100 : 0
      const phoneBoothUtilization = totalPhoneBoothHours > 0 ? (bookedPhoneBoothHours / totalPhoneBoothHours) * 100 : 0

      const roomUtilization = (meetingRoomUtilization + phoneBoothUtilization) / 2 // Simple average

      // Calculate available resources right now
      const availableResources = resources.filter((resource) => {
        if (resource.status !== "available") return false

        // Check if this resource is currently booked
        const isCurrentlyBooked = bookings.some((booking) => {
          if (
            booking.resourceId === resource.id &&
            isToday(booking.date) &&
            (booking.status === "confirmed" || booking.status === "pending")
          ) {
            const bookingStartMinutes = timeToMinutes(booking.startTime)
            const bookingEndMinutes = timeToMinutes(booking.endTime)
            // Check if current time is within the booking slot
            return currentTimeInMinutes >= bookingStartMinutes && currentTimeInMinutes < bookingEndMinutes
          }
          return false
        })
        return !isCurrentlyBooked
      }).length

      console.log("AdminDataProvider: getDashboardStats calculated:", {
        totalBookingsToday,
        activeMembers,
        roomUtilization,
        availableResources,
      })

      return {
        totalBookingsToday,
        activeMembers,
        roomUtilization: Number.parseFloat(roomUtilization.toFixed(1)), // Round to 1 decimal place
        availableResources,
      }
    }
  }, [bookings, members, resources, bookingsLoaded])

  const value: AdminDataContextType = {
    members,
    resources,
    addMember,
    updateMember,
    removeMember,
    addResource,
    updateResource,
    removeResource,
    getDashboardStats,
    isLoaded: isLoaded && bookingsLoaded, // Admin data is loaded only when both are ready
  }

  console.log(
    "AdminDataProvider: Returning context value. isLoaded:",
    value.isLoaded,
    "Members count:",
    members.length,
    "Resources count:",
    resources.length,
  )

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}

export function useAdminData() {
  const context = useContext(AdminDataContext)
  if (context === undefined) {
    throw new Error("useAdminData must be used within an AdminDataProvider")
  }
  return context
}
