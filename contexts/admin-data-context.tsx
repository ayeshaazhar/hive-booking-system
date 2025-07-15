"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export interface Member {
  id: string
  name: string
  email: string
  company: string
  department: string
  phone: string
  status: "active" | "inactive" | "pending"
  joinDate: string // ISO string
  totalBookings: number
  role: "member" | "admin"
  image?: string
}

export interface Resource {
  id: string
  name: string
  type: "meeting_room" | "phone_booth" | "desk" | "equipment"
  capacity: number
  location: string
  status: "available" | "maintenance" | "booked"
  description?: string
  image?: string
}

interface AdminDataContextType {
  members: Member[]
  resources: Resource[]
  isLoaded: boolean
  addMember: (member: Omit<Member, "id" | "joinDate" | "totalBookings" | "status" | "role">) => void
  updateMember: (id: string, updates: Partial<Member>) => void
  deleteMember: (id: string) => void
  addResource: (resource: Omit<Resource, "id" | "status">) => void
  updateResource: (id: string, updates: Partial<Resource>) => void
  deleteResource: (id: string) => void
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined)

const initialMembers: Member[] = [
  {
    id: "mem-1",
    name: "Alice Smith",
    email: "alice@example.com",
    company: "Tech Solutions",
    department: "Engineering",
    phone: "555-111-2222",
    status: "active",
    joinDate: "2023-01-15",
    totalBookings: 12,
    role: "member",
    image: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "mem-2",
    name: "Bob Johnson",
    email: "bob@example.com",
    company: "Creative Agency",
    department: "Design",
    phone: "555-333-4444",
    status: "active",
    joinDate: "2023-02-20",
    totalBookings: 8,
    role: "member",
    image: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "mem-3",
    name: "Charlie Brown",
    email: "charlie@example.com",
    company: "Data Insights",
    department: "Analytics",
    phone: "555-555-6666",
    status: "inactive",
    joinDate: "2023-03-10",
    totalBookings: 3,
    role: "member",
    image: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "admin-1",
    name: "Admin User",
    email: "admin@example.com",
    company: "Hive HQ",
    department: "Management",
    phone: "555-000-1111",
    status: "active",
    joinDate: "2022-10-01",
    totalBookings: 50,
    role: "admin",
    image: "/placeholder.svg?height=40&width=40",
  },
]

const initialResources: Resource[] = [
  {
    id: "res-1",
    name: "Meeting Room Alpha",
    type: "meeting_room",
    capacity: 8,
    location: "Floor 1",
    status: "available",
    description: "Spacious room with projector and whiteboard.",
    image: "/placeholder.svg?height=100&width=150",
  },
  {
    id: "res-2",
    name: "Phone Booth 1",
    type: "phone_booth",
    capacity: 1,
    location: "Floor 2",
    status: "available",
    description: "Private booth for calls.",
    image: "/placeholder.svg?height=100&width=150",
  },
  {
    id: "res-3",
    name: "Projector Beta",
    type: "equipment",
    capacity: 1,
    location: "Storage Room",
    status: "maintenance",
    description: "High-definition portable projector.",
    image: "/placeholder.svg?height=100&width=150",
  },
  {
    id: "res-4",
    name: "Desk 15",
    type: "desk",
    capacity: 1,
    location: "Open Space",
    status: "available",
    description: "Standard hot desk with monitor.",
    image: "/placeholder.svg?height=100&width=150",
  },
]

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load from localStorage
    const storedMembers = localStorage.getItem("hive-members")
    const storedResources = localStorage.getItem("hive-resources")

    if (storedMembers) {
      setMembers(JSON.parse(storedMembers))
    } else {
      setMembers(initialMembers)
    }

    if (storedResources) {
      setResources(JSON.parse(storedResources))
    } else {
      setResources(initialResources)
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("hive-members", JSON.stringify(members))
    }
  }, [members, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("hive-resources", JSON.stringify(resources))
    }
  }, [resources, isLoaded])

  const addMember = useCallback(
    (newMemberData: Omit<Member, "id" | "joinDate" | "totalBookings" | "status" | "role">) => {
      setMembers((prev) => {
        const newMember: Member = {
          id: `mem-${Date.now()}`,
          joinDate: new Date().toISOString().split("T")[0],
          totalBookings: 0,
          status: "active", // Default status for new members
          role: "member", // Default role for new members
          ...newMemberData,
        }
        return [...prev, newMember]
      })
    },
    [],
  )

  const updateMember = useCallback((id: string, updates: Partial<Member>) => {
    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, ...updates } : member)))
  }, [])

  const deleteMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id))
  }, [])

  const addResource = useCallback((newResourceData: Omit<Resource, "id" | "status">) => {
    setResources((prev) => {
      const newResource: Resource = {
        id: `res-${Date.now()}`,
        status: "available", // Default status for new resources
        ...newResourceData,
      }
      return [...prev, newResource]
    })
  }, [])

  const updateResource = useCallback((id: string, updates: Partial<Resource>) => {
    setResources((prev) => prev.map((resource) => (resource.id === id ? { ...resource, ...updates } : resource)))
  }, [])

  const deleteResource = useCallback((id: string) => {
    setResources((prev) => prev.filter((resource) => resource.id !== id))
  }, [])

  const value = React.useMemo(
    () => ({
      members,
      resources,
      isLoaded,
      addMember,
      updateMember,
      deleteMember,
      addResource,
      updateResource,
      deleteResource,
    }),
    [members, resources, isLoaded, addMember, updateMember, deleteMember, addResource, updateResource, deleteResource],
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
