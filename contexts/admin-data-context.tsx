"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

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
  role: string
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

/** All bookings (admin); normalized from Prisma include user/resource */
export interface AdminBooking {
  id: string
  userId: string
  resourceId: string
  startTime: string
  endTime: string
  status: string
  purpose?: string
  notes?: string
  userName?: string
  userEmail?: string
  resourceName?: string
}

function normalizeBooking(raw: Record<string, unknown>): AdminBooking {
  const user = raw.user as { name?: string; email?: string } | undefined
  const resource = raw.resource as { name?: string } | undefined
  const st = raw.startTime
  const et = raw.endTime
  return {
    id: String(raw.id),
    userId: String(raw.userId),
    resourceId: String(raw.resourceId),
    startTime: typeof st === "string" ? st : st instanceof Date ? st.toISOString() : "",
    endTime: typeof et === "string" ? et : et instanceof Date ? et.toISOString() : "",
    status: String(raw.status ?? ""),
    purpose: raw.purpose != null ? String(raw.purpose) : undefined,
    notes: raw.notes != null ? String(raw.notes) : undefined,
    userName: user?.name,
    userEmail: user?.email,
    resourceName: resource?.name,
  }
}

function normalizeResource(raw: Record<string, unknown>): Resource {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ""),
    type: String(raw.type ?? ""),
    capacity: Number(raw.capacity) || 0,
    location: String(raw.location ?? ""),
    description: String(raw.description ?? ""),
    status: String(raw.status ?? "available"),
    image: raw.image != null ? String(raw.image) : undefined,
    amenities: Array.isArray(raw.amenities) ? (raw.amenities as string[]) : undefined,
  }
}

function normalizeMember(raw: Record<string, unknown>): Member {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    company: String(raw.company ?? ""),
    department: String(raw.department ?? ""),
    phone: String(raw.phone ?? ""),
    joinDate: String(raw.joinDate ?? ""),
    totalBookings: Number(raw.totalBookings) || 0,
    status: String(raw.status ?? "active"),
    role: String(raw.role ?? "member"),
  }
}

interface AdminDataContextType {
  members: Member[]
  resources: Resource[]
  bookings: AdminBooking[]
  isLoaded: boolean
  refresh: () => Promise<void>
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>
  setBookings: React.Dispatch<React.SetStateAction<AdminBooking[]>>
  addResource: (resource: Omit<Resource, "id"> & { status?: string }) => Promise<void>
  updateResource: (id: string, updates: Partial<Resource>) => Promise<void>
  deleteResource: (id: string) => Promise<void>
  addMember: (member: Omit<Member, "id" | "joinDate" | "totalBookings">) => Promise<void>
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>
  deleteMember: (id: string) => Promise<void>
  updateBooking: (id: string, updates: Record<string, unknown>) => Promise<void>
  deleteBooking: (id: string) => Promise<void>
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
  const { data: session, status } = useSession()
  const [members, setMembers] = useState<Member[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const refresh = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.email) {
      setMembers([])
      setBookings([])
      setIsLoaded(true)
      return
    }

    const isAdmin = Boolean((session.user as { isAdmin?: boolean }).isAdmin)

    try {
      const membersP = fetch("/api/members").then(async (res) => {
        if (!res.ok) return []
        const data = await res.json()
        return Array.isArray(data) ? data.map((x: Record<string, unknown>) => normalizeMember(x)) : []
      })
      const resourcesP = fetch("/api/resources").then(async (res) => {
        if (!res.ok) return []
        const data = await res.json()
        return Array.isArray(data) ? data.map((x: Record<string, unknown>) => normalizeResource(x)) : []
      })
      const bookingsP = isAdmin
        ? fetch("/api/bookings").then(async (res) => {
            if (!res.ok) return []
            const data = await res.json()
            return Array.isArray(data) ? data.map((x: Record<string, unknown>) => normalizeBooking(x)) : []
          })
        : Promise.resolve([] as AdminBooking[])

      const [m, r, b] = await Promise.all([membersP, resourcesP, bookingsP])
      setMembers(m)
      setResources(r)
      setBookings(b)
    } catch (e) {
      console.error("AdminDataProvider refresh", e)
    } finally {
      setIsLoaded(true)
    }
  }, [session, status])

  useEffect(() => {
    if (status === "loading") return
    void refresh()
  }, [refresh, status])

  const addResource = async (resource: Omit<Resource, "id"> & { status?: string }) => {
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resource),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(typeof body.error === "string" ? body.error : "Failed to create resource")
    }
    setResources((prev) => [...prev, normalizeResource(body as Record<string, unknown>)])
  }

  const updateResource = async (id: string, updates: Partial<Resource>) => {
    const current = resources.find((r) => r.id === id)
    const fullUpdate = {
      name: updates.name ?? current?.name ?? "",
      type: updates.type ?? current?.type ?? "",
      capacity: updates.capacity ?? current?.capacity ?? 1,
      location: updates.location ?? current?.location ?? "",
      description: updates.description ?? current?.description ?? "",
      status: updates.status ?? current?.status ?? "available",
    }
    const res = await fetch(`/api/resources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullUpdate),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(typeof body.error === "string" ? body.error : "Failed to update resource")
    }
    const updated = normalizeResource(body as Record<string, unknown>)
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)))
  }

  const deleteResource = async (id: string) => {
    const res = await fetch(`/api/resources/${id}`, { method: "DELETE" })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(typeof body.error === "string" ? body.error : "Failed to delete resource")
    }
    setResources((prev) => prev.filter((r) => r.id !== id))
  }

  const addMember = async (member: Omit<Member, "id" | "joinDate" | "totalBookings">) => {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(typeof body.error === "string" ? body.error : "Failed to create member")
    }
    setMembers((prev) => [...prev, normalizeMember(body as Record<string, unknown>)])
  }

  const updateMember = async (id: string, updates: Partial<Member>) => {
    const res = await fetch(`/api/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(typeof body.error === "string" ? body.error : "Failed to update member")
    }
    setMembers((prev) => prev.map((m) => (m.id === id ? normalizeMember(body as Record<string, unknown>) : m)))
  }

  const deleteMember = async (id: string) => {
    const res = await fetch(`/api/members/${id}`, { method: "DELETE" })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(typeof body.error === "string" ? body.error : "Failed to delete member")
    }
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  const updateBooking = async (id: string, updates: Record<string, unknown>) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(typeof body.error === "string" ? body.error : "Failed to update booking")
    }
    const row = normalizeBooking(body as Record<string, unknown>)
    setBookings((prev) => prev.map((b) => (b.id === id ? row : b)))
  }

  const deleteBooking = async (id: string) => {
    const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(typeof body.error === "string" ? body.error : "Failed to delete booking")
    }
    setBookings((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <AdminDataContext.Provider
      value={{
        members,
        resources,
        bookings,
        isLoaded,
        refresh,
        setMembers,
        setResources,
        setBookings,
        addResource,
        updateResource,
        deleteResource,
        addMember,
        updateMember,
        deleteMember,
        updateBooking,
        deleteBooking,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  )
}
