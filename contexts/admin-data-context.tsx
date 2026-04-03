"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface Member {
  id: string
  name: string
  email: string
  company: string
  department: string
  phone: string
  joinDate: string
  totalBookings: number
  status: string
  image?: string
}

export interface Resource {
  id: string
  name: string
  type: string
  capacity: number
  location: string
  description: string
  status: string
  image?: string
  amenities?: string[]
}

export interface Booking {
  id: string
  resourceId: string
  memberId: string
  startTime: string // ISO string
  endTime: string // ISO string
  status: string
}

interface AdminDataContextType {
  members: Member[]
  resources: Resource[]
  bookings: Booking[]
  isLoaded: boolean
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>
  addResource: (resource: Omit<Resource, "id" | "status">) => Promise<void>
  updateResource: (id: string, updates: Partial<Resource>) => Promise<void>
  deleteResource: (id: string) => Promise<void>
  addMember: (member: Omit<Member, "id" | "status" | "totalBookings" | "joinDate">) => Promise<void>
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>
  deleteMember: (id: string) => Promise<void>
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined)

export const useAdminData = () => {
  const context = useContext(AdminDataContext)
  if (!context) {
    throw new Error("useAdminData must be used within an AdminDataProvider")
  }
  return context
}

export const AdminDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [members, setMembers] = useState<Member[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const [membersRes, resourcesRes, bookingsRes] = await Promise.all([
        fetch("/api/members"),
        fetch("/api/resources"),
        fetch("/api/bookings"),
      ])
      let membersData = await membersRes.json()
      let resourcesData = await resourcesRes.json()
      let bookingsData = await bookingsRes.json()
      if (!Array.isArray(membersData)) membersData = []
      if (!Array.isArray(resourcesData)) resourcesData = []
      if (!Array.isArray(bookingsData)) bookingsData = []
      setMembers(membersData)
      setResources(resourcesData)
      setBookings(bookingsData)
      setIsLoaded(true)
    }
    fetchData()
  }, [])

  const addResource = async (resource: Omit<Resource, "id" | "status"> & { status?: string }) => {
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resource),
    })
    const newResource = await res.json()
    setResources((prev) => [...prev, newResource])
  }

  const updateResource = async (id: string, updates: Partial<Resource>) => {
    // Find the current resource to fill in missing fields
    const current = resources.find(r => r.id === id)
    const fullUpdate = {
      name: updates.name ?? current?.name ?? '',
      type: updates.type ?? current?.type ?? '',
      capacity: updates.capacity ?? current?.capacity ?? 1,
      location: updates.location ?? current?.location ?? '',
      description: updates.description ?? current?.description ?? '',
      status: updates.status ?? current?.status ?? 'available',
    }
    const res = await fetch(`/api/resources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullUpdate),
    })
    const updated = await res.json()
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)))
  }

  const deleteResource = async (id: string) => {
    await fetch(`/api/resources/${id}`, { method: "DELETE" })
    setResources((prev) => prev.filter((r) => r.id !== id))
  }

  const addMember = async (member: Omit<Member, "id" | "status" | "totalBookings" | "joinDate">) => {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    })
    const newMember = await res.json()
    setMembers((prev) => [...prev, newMember])
  }

  const updateMember = async (id: string, updates: Partial<Member>) => {
    const res = await fetch(`/api/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    const updated = await res.json()
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)))
  }

  const deleteMember = async (id: string) => {
    await fetch(`/api/members/${id}`, { method: "DELETE" })
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <AdminDataContext.Provider
      value={{
        members,
        resources,
        bookings,
        isLoaded,
        setMembers,
        setResources,
        setBookings,
        addResource,
        updateResource,
        deleteResource,
        addMember,
        updateMember,
        deleteMember,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  )
}
