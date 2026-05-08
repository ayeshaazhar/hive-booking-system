"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Calendar,
  TrendingUp,
  MoreHorizontal,
  Plus,
  Search,
  Building2,
  UserPlus,
  type LucideIcon,
} from "lucide-react"
import type { Resource, Member, AdminBooking } from "@/contexts/admin-data-context"
import { useAdminData } from "@/contexts/admin-data-context"
import { ResourceFormDialog } from "@/components/resource-form-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MemberFormDialog } from "@/components/member-form-dialog"
import { AdminBookingEditDialog } from "@/components/admin-booking-edit-dialog"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Navigation } from "@/components/navigation"

function localYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false)
  const [resourceEditing, setResourceEditing] = useState<Resource | null>(null)
  const [showDeleteResourceId, setShowDeleteResourceId] = useState<string | null>(null)
  const [resourceSearch, setResourceSearch] = useState("")
  const [resourceTypeFilter, setResourceTypeFilter] = useState("all")

  const [memberSearch, setMemberSearch] = useState("")
  const [memberRoleFilter, setMemberRoleFilter] = useState("all")
  const [memberStatusFilter, setMemberStatusFilter] = useState("all")
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [memberBookingsFor, setMemberBookingsFor] = useState<Member | null>(null)
  const [showDeleteMemberId, setShowDeleteMemberId] = useState<string | null>(null)

  const [bookingSearch, setBookingSearch] = useState("")
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all")
  const [bookingListTab, setBookingListTab] = useState<"all" | "upcoming" | "history">("upcoming")
  const [bookingToEdit, setBookingToEdit] = useState<AdminBooking | null>(null)
  const [bookingEditOpen, setBookingEditOpen] = useState(false)
  const [notifications, setNotifications] = useState<
    { id: string; title: string; message: string; createdAt: string; isRead: boolean }[]
  >([])

  const {
    members,
    resources,
    bookings,
    isLoaded,
    refresh,
    addResource,
    updateResource,
    deleteResource,
    addMember,
    updateMember,
    deleteMember,
    updateBooking,
    deleteBooking,
  } = useAdminData()

  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [user, loading, router])

  const bookingStats = useMemo(() => {
    const today = localYmd(new Date())
    const activeMembers = members.filter((m) => m.status === "active").length
    const availableResources = resources.filter((r) => r.status === "available").length
    const totalBookingsToday = bookings.filter((b) => localYmd(new Date(b.startTime)) === today).length
    const upcoming = bookings.filter(
      (b) => b.status !== "cancelled" && new Date(b.endTime) > new Date(),
    ).length
    const slotBlocks = Math.max(1, resources.length * 8)
    const utilization = Math.min(100, Math.round((totalBookingsToday / slotBlocks) * 100))

    const stats: { title: string; value: string; hint: string; icon: LucideIcon }[] = [
      { title: "Total users", value: String(members.length), hint: "Registered accounts", icon: Users },
      { title: "Resources", value: String(resources.length), hint: `${availableResources} marked available`, icon: Building2 },
      { title: "All bookings", value: String(bookings.length), hint: `${upcoming} upcoming`, icon: Calendar },
      { title: "Bookings today", value: String(totalBookingsToday), hint: `~${utilization}% rough utilization`, icon: TrendingUp },
    ]
    return stats
  }, [members, resources, bookings])

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.toLowerCase()
    return bookings.filter((b) => {
      const end = new Date(b.endTime)
      const isUpcoming = b.status !== "cancelled" && end > new Date()
      if (bookingListTab === "upcoming" && !isUpcoming) return false
      if (bookingListTab === "history" && isUpcoming) return false
      if (bookingStatusFilter !== "all" && b.status !== bookingStatusFilter) return false
      const member = members.find((m) => m.id === b.userId)
      const resource = resources.find((r) => r.id === b.resourceId)
      const hay = `${member?.name ?? ""} ${member?.email ?? ""} ${resource?.name ?? ""} ${b.purpose ?? ""}`.toLowerCase()
      if (q && !hay.includes(q)) return false
      return true
    })
  }, [bookings, bookingSearch, bookingStatusFilter, bookingListTab, members, resources])

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 12)
  }, [bookings])

  const memberBookingsList = useMemo(() => {
    if (!memberBookingsFor) return []
    return bookings
      .filter((b) => b.userId === memberBookingsFor.id)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
  }, [bookings, memberBookingsFor])

  useEffect(() => {
    if (!user) return
    let alive = true
    const loadNotifications = async () => {
      const res = await fetch("/api/notifications")
      if (!res.ok) return
      const data = await res.json()
      if (alive && Array.isArray(data)) {
        setNotifications(
          data.map((n: any) => ({
            id: String(n.id),
            title: String(n.title ?? "Notification"),
            message: String(n.message ?? ""),
            createdAt: String(n.createdAt ?? new Date().toISOString()),
            isRead: Boolean(n.isRead),
          })),
        )
      }
    }
    void loadNotifications()
    const id = setInterval(() => void loadNotifications(), 30_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [user])

  async function run(op: () => Promise<void>, success: string) {
    try {
      await op()
      toast.success(success)
      await refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operation failed")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
      case "active":
      case "available":
      case "completed":
        return "default" as const
      case "pending":
        return "secondary" as const
      case "cancelled":
      case "inactive":
      case "maintenance":
        return "destructive" as const
      case "booked":
        return "outline" as const
      default:
        return "secondary" as const
    }
  }

  const getMemberStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default" as const
      case "pending":
        return "secondary" as const
      case "inactive":
        return "destructive" as const
      default:
        return "secondary" as const
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-2">Loading Admin Dashboard…</h1>
          <p className="text-gray-500 text-center">Checking your session</p>
        </div>
      </div>
    )
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold mb-2 text-red-600">Access denied</h1>
          <p className="text-gray-500 mb-4">You need an administrator account to use this area.</p>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    )
  }

  const resourceTypeOptions = [
    { value: "all", label: "All types" },
    { value: "meeting_room", label: "Meeting rooms" },
    { value: "phone_booth", label: "Phone booths" },
    { value: "equipment", label: "Equipment" },
  ]

  const memberRoleOptions = [
    { value: "all", label: "All roles" },
    { value: "member", label: "Member" },
    { value: "admin", label: "Admin" },
  ]

  const memberStatusOptions = [
    { value: "all", label: "All statuses" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "pending", label: "Pending" },
  ]

  const renderBookingRow = (booking: AdminBooking, compact?: boolean) => {
    const member = members.find((m) => m.id === booking.userId)
    const resource = resources.find((r) => r.id === booking.resourceId)
    return (
      <TableRow key={booking.id}>
        <TableCell className="font-medium whitespace-nowrap">{member?.name ?? booking.userName ?? "—"}</TableCell>
        {!compact && <TableCell className="text-sm text-muted-foreground">{member?.email ?? booking.userEmail ?? "—"}</TableCell>}
        <TableCell>{resource?.name ?? booking.resourceName ?? "—"}</TableCell>
        <TableCell>
          <div>
            <div>{new Date(booking.startTime).toLocaleDateString()}</div>
            <div className="text-sm text-gray-500">
              {new Date(booking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
              {new Date(booking.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={getStatusColor(booking.status)}>{booking.status}</Badge>
        </TableCell>
        <TableCell className="max-w-[180px] truncate">{booking.purpose ?? "—"}</TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="Booking actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {booking.status === "pending" && (
                <DropdownMenuItem
                  onClick={() => run(() => updateBooking(booking.id, { status: "confirmed" }), "Booking confirmed")}
                >
                  Confirm
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => {
                  setBookingToEdit(booking)
                  setBookingEditOpen(true)
                }}
              >
                Edit
              </DropdownMenuItem>
              {booking.status !== "cancelled" && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() =>
                    run(
                      () => updateBooking(booking.id, { status: "cancelled", notes: "Cancelled by admin" }),
                      "Booking cancelled",
                    )
                  }
                >
                  Cancel
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  if (confirm("Permanently remove this booking record?")) {
                    void run(() => deleteBooking(booking.id), "Booking removed")
                  }
                }}
              >
                Delete record
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50/80">
      <Navigation />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin</h1>
            <p className="text-gray-600 mt-1">Resources, bookings, and members</p>
          </div>

          {!isLoaded ? (
            <div className="flex justify-center py-20 text-gray-500">Loading data…</div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1 max-w-3xl">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="bookings" className="text-xs sm:text-sm">
                  Bookings
                </TabsTrigger>
                <TabsTrigger value="members" className="text-xs sm:text-sm">
                  Members
                </TabsTrigger>
                <TabsTrigger value="resources" className="text-xs sm:text-sm">
                  Resources
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {bookingStats.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stat.value}</div>
                          <p className="text-xs text-muted-foreground mt-1">{stat.hint}</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent bookings</CardTitle>
                    <CardDescription>Newest first</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto -mx-2 px-2">
                    {recentBookings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No bookings yet.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Resource</TableHead>
                            <TableHead>When</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>{recentBookings.map((b) => renderBookingRow(b, true))}</TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent notifications</CardTitle>
                    <CardDescription>Latest admin/user events in this workspace</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No notifications yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {notifications.slice(0, 6).map((n) => (
                          <div key={n.id} className="border rounded-md p-3">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{n.title}</p>
                              {!n.isRead && <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />}
                            </div>
                            <p className="text-sm text-muted-foreground">{n.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bookings" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All bookings</CardTitle>
                    <CardDescription>Filter by segment and status. Edits respect resource conflicts.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <Tabs value={bookingListTab} onValueChange={(v) => setBookingListTab(v as typeof bookingListTab)}>
                        <TabsList className="w-full sm:w-auto">
                          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                          <TabsTrigger value="history">History</TabsTrigger>
                          <TabsTrigger value="all">All</TabsTrigger>
                        </TabsList>
                      </Tabs>
                      <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search member, resource, purpose…"
                          className="pl-9"
                          value={bookingSearch}
                          onChange={(e) => setBookingSearch(e.target.value)}
                        />
                      </div>
                      <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="overflow-x-auto rounded-md border">
                      {filteredBookings.length === 0 ? (
                        <p className="p-6 text-sm text-muted-foreground">No bookings match.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Member</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Resource</TableHead>
                              <TableHead>When</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Purpose</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>{filteredBookings.map((b) => renderBookingRow(b))}</TableBody>
                        </Table>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="members" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle>Members</CardTitle>
                        <CardDescription>Directory and access</CardDescription>
                      </div>
                      <Button className="w-full sm:w-auto shrink-0" onClick={() => setInviteDialogOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite member
                      </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search…"
                          className="pl-9"
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                        />
                      </div>
                      <Select value={memberRoleFilter} onValueChange={setMemberRoleFilter}>
                        <SelectTrigger className="w-full sm:w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {memberRoleOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={memberStatusFilter} onValueChange={setMemberStatusFilter}>
                        <SelectTrigger className="w-full sm:w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {memberStatusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Bookings</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members
                          .filter((member) => {
                            const q = memberSearch.toLowerCase()
                            const matchesRole = memberRoleFilter === "all" || member.role === memberRoleFilter
                            const matchesStatus = memberStatusFilter === "all" || member.status === memberStatusFilter
                            const matchesQ =
                              !q ||
                              member.name.toLowerCase().includes(q) ||
                              member.email.toLowerCase().includes(q) ||
                              (member.company && member.company.toLowerCase().includes(q))
                            return matchesRole && matchesStatus && matchesQ
                          })
                          .map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">{member.name}</TableCell>
                              <TableCell className="text-sm">{member.email}</TableCell>
                              <TableCell className="text-sm">{member.company || "—"}</TableCell>
                              <TableCell className="capitalize">{member.role}</TableCell>
                              <TableCell>{member.totalBookings}</TableCell>
                              <TableCell>
                                <Badge variant={getMemberStatusVariant(member.status)}>{member.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="ghost">
                                      <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setMemberBookingsFor(member)}>Booking history</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setEditMember(member)}>Edit</DropdownMenuItem>
                                    {member.status === "active" && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          run(() => updateMember(member.id, { status: "inactive" }), "Member deactivated")
                                        }
                                      >
                                        Deactivate
                                      </DropdownMenuItem>
                                    )}
                                    {member.status !== "active" && (
                                      <DropdownMenuItem
                                        onClick={() => run(() => updateMember(member.id, { status: "active" }), "Member reactivated")}
                                      >
                                        Reactivate
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => {
                                        if (member.totalBookings > 0) {
                                          toast.error("Remove bookings first, or deactivate the account.")
                                          return
                                        }
                                        setShowDeleteMemberId(member.id)
                                      }}
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <MemberFormDialog
                  open={!!editMember}
                  onOpenChange={(open) => {
                    if (!open) setEditMember(null)
                  }}
                  member={editMember ?? undefined}
                  onSave={async (data) => {
                    if (editMember?.id) {
                      const m = data as Member
                      await updateMember(editMember.id, {
                        name: m.name,
                        email: m.email,
                        company: m.company,
                        department: m.department,
                        phone: m.phone,
                        role: m.role,
                        status: m.status,
                      })
                      await refresh()
                      toast.success("Member updated")
                    }
                    setEditMember(null)
                  }}
                />
                <MemberFormDialog
                  open={inviteDialogOpen}
                  onOpenChange={setInviteDialogOpen}
                  onSave={async (data) => {
                    await addMember(data as Omit<Member, "id" | "joinDate" | "totalBookings">)
                    await refresh()
                    toast.success("Member invited")
                    setInviteDialogOpen(false)
                  }}
                />
                <Dialog open={!!showDeleteMemberId} onOpenChange={(o) => !o && setShowDeleteMemberId(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete member</DialogTitle>
                      <DialogDescription>This cannot be undone. Only allowed when the user has no bookings.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDeleteMemberId(null)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          const id = showDeleteMemberId!
                          void run(() => deleteMember(id), "Member deleted")
                          setShowDeleteMemberId(null)
                        }}
                      >
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={!!memberBookingsFor} onOpenChange={(o) => !o && setMemberBookingsFor(null)}>
                  <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Booking history</DialogTitle>
                      <DialogDescription>{memberBookingsFor?.name}</DialogDescription>
                    </DialogHeader>
                    {memberBookingsList.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">No bookings.</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {memberBookingsList.map((b) => (
                          <li key={b.id} className="border rounded-md p-3">
                            <div className="font-medium">{b.resourceName ?? resources.find((r) => r.id === b.resourceId)?.name}</div>
                            <div className="text-muted-foreground">
                              {new Date(b.startTime).toLocaleString()} – {new Date(b.endTime).toLocaleTimeString()}
                            </div>
                            <Badge className="mt-1" variant={getStatusColor(b.status)}>
                              {b.status}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="resources" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle>Resources</CardTitle>
                        <CardDescription>Rooms, booths, equipment</CardDescription>
                      </div>
                      <Button
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setResourceEditing(null)
                          setResourceDialogOpen(true)
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add resource
                      </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          className="pl-9"
                          placeholder="Search…"
                          value={resourceSearch}
                          onChange={(e) => setResourceSearch(e.target.value)}
                        />
                      </div>
                      <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {resourceTypeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Amenities</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resources
                          .filter((resource) => {
                            const q = resourceSearch.toLowerCase()
                            const matchesType = resourceTypeFilter === "all" || resource.type === resourceTypeFilter
                            const matchesQ =
                              !q ||
                              resource.name.toLowerCase().includes(q) ||
                              resource.location.toLowerCase().includes(q)
                            return matchesType && matchesQ
                          })
                          .map((resource) => (
                            <TableRow key={resource.id}>
                              <TableCell className="font-medium">{resource.name}</TableCell>
                              <TableCell>{resource.type.replace(/_/g, " ")}</TableCell>
                              <TableCell>{resource.capacity}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    resource.status === "available"
                                      ? "default"
                                      : resource.status === "maintenance"
                                        ? "destructive"
                                        : "outline"
                                  }
                                >
                                  {resource.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{resource.location}</TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {resource.amenities?.length ? resource.amenities.join(", ") : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="ghost">
                                      <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setResourceEditing(resource)
                                        setResourceDialogOpen(true)
                                      }}
                                    >
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => setShowDeleteResourceId(resource.id)}>
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <ResourceFormDialog
                  open={resourceDialogOpen}
                  onOpenChange={(open) => {
                    setResourceDialogOpen(open)
                    if (!open) setResourceEditing(null)
                  }}
                  resource={resourceEditing}
                  onSave={async (data) => {
                    if ("id" in data && data.id) {
                      await updateResource(data.id, data)
                      toast.success("Resource updated")
                    } else {
                      await addResource(data as Omit<Resource, "id">)
                      toast.success("Resource created")
                    }
                    await refresh()
                  }}
                />
                <Dialog open={!!showDeleteResourceId} onOpenChange={(o) => !o && setShowDeleteResourceId(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete resource</DialogTitle>
                      <DialogDescription>Only allowed when there are no bookings for this resource.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDeleteResourceId(null)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          const id = showDeleteResourceId!
                          void run(() => deleteResource(id), "Resource deleted")
                          setShowDeleteResourceId(null)
                        }}
                      >
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <AdminBookingEditDialog
        open={bookingEditOpen}
        onOpenChange={(o) => {
          setBookingEditOpen(o)
          if (!o) setBookingToEdit(null)
        }}
        booking={bookingToEdit}
        allBookings={bookings}
        onSave={async (updates) => {
          if (!bookingToEdit) return
          await updateBooking(bookingToEdit.id, updates)
        }}
      />
    </div>
  )
}
