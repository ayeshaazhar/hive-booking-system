"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Calendar,
  MoreHorizontal,
  Plus,
  Search,
  Building,
  Laptop,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react"
import Image from "next/image"
import { Navigation } from "./navigation"
import { useAdminData, type Member, type Resource, type MemberStatus } from "@/contexts/admin-data-context"
import { useBookings, type BookingStatus } from "@/contexts/booking-context"
import { MemberFormDialog } from "./member-form-dialog"
import { ResourceFormDialog } from "./resource-form-dialog"
import { formatDateForDisplay } from "@/lib/date-utils"

export function AdminDashboard() {
  const {
    members,
    resources,
    addMember,
    updateMember,
    removeMember,
    addResource,
    updateResource,
    removeResource,
    getDashboardStats,
    isLoaded: isAdminDataLoaded,
  } = useAdminData()
  const { bookings, updateBooking, cancelBooking, clearAllBookings, isLoaded: isBookingsLoaded } = useBookings()

  const isDataLoaded = isAdminDataLoaded && isBookingsLoaded

  const [memberSearch, setMemberSearch] = React.useState("")
  const [memberStatusFilter, setMemberStatusFilter] = React.useState<MemberStatus | "all">("all")
  const [resourceSearch, setResourceSearch] = React.useState("")
  const [resourceTypeFilter, setResourceTypeFilter] = React.useState<string | "all">("all")
  const [bookingSearch, setBookingSearch] = React.useState("")
  const [bookingStatusFilter, setBookingStatusFilter] = React.useState<BookingStatus | "all">("all")

  const [isMemberFormOpen, setIsMemberFormOpen] = React.useState(false)
  const [editingMember, setEditingMember] = React.useState<Member | undefined>(undefined)
  const [isResourceFormOpen, setIsResourceFormOpen] = React.useState(false)
  const [editingResource, setEditingResource] = React.useState<Resource | undefined>(undefined)

  const stats = isDataLoaded
    ? getDashboardStats()
    : {
        totalBookingsToday: 0,
        activeMembers: 0,
        roomUtilization: 0,
        availableResources: 0,
      }

  const filteredMembers = React.useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        member.email.toLowerCase().includes(memberSearch.toLowerCase())
      const matchesStatus = memberStatusFilter === "all" || member.status === memberStatusFilter
      return matchesSearch && matchesStatus
    })
  }, [members, memberSearch, memberStatusFilter])

  const filteredResources = React.useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch = resource.name.toLowerCase().includes(resourceSearch.toLowerCase())
      const matchesType = resourceTypeFilter === "all" || resource.type === resourceTypeFilter
      return matchesSearch && matchesType
    })
  }, [resources, resourceSearch, resourceTypeFilter])

  const filteredBookings = React.useMemo(() => {
    return bookings
      .filter((booking) => {
        const member = members.find((m) => m.id === booking.userId)
        const resource = resources.find((r) => r.id === booking.resourceId)

        const matchesSearch =
          bookingSearch === "" ||
          booking.resource.toLowerCase().includes(bookingSearch.toLowerCase()) ||
          (member?.name || "").toLowerCase().includes(bookingSearch.toLowerCase()) ||
          (resource?.name || "").toLowerCase().includes(bookingSearch.toLowerCase())

        const matchesStatus = bookingStatusFilter === "all" || booking.status === bookingStatusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by most recent
  }, [bookings, members, resources, bookingSearch, bookingStatusFilter])

  const handleEditMember = (member: Member) => {
    setEditingMember(member)
    setIsMemberFormOpen(true)
  }

  const handleSaveMember = (memberData: Omit<Member, "id" | "createdAt">) => {
    if (editingMember) {
      updateMember(editingMember.id, memberData)
    } else {
      addMember(memberData)
    }
    setEditingMember(undefined)
  }

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource)
    setIsResourceFormOpen(true)
  }

  const handleSaveResource = (resourceData: Omit<Resource, "id" | "createdAt">) => {
    if (editingResource) {
      updateResource(editingResource.id, resourceData)
    } else {
      addResource(resourceData)
    }
    setEditingResource(undefined)
  }

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2">Loading admin dashboard...</span>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookingsToday}</div>
              <p className="text-xs text-muted-foreground">Confirmed bookings for today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeMembers}</div>
              <p className="text-xs text-muted-foreground">Currently active users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Room Utilization</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.roomUtilization}%</div>
              <p className="text-xs text-muted-foreground">Average utilization today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Resources</CardTitle>
              <Laptop className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.availableResources}</div>
              <p className="text-xs text-muted-foreground">Currently available for booking</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  className="pl-8"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                />
              </div>
              <Select
                value={bookingStatusFilter}
                onValueChange={(value: BookingStatus | "all") => setBookingStatusFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No bookings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => {
                    const member = members.find((m) => m.id === booking.userId)
                    return (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.resource}</TableCell>
                        <TableCell>{member ? member.name : "Unknown User"}</TableCell>
                        <TableCell>{formatDateForDisplay(booking.date)}</TableCell>
                        <TableCell>{`${booking.startTime} - ${booking.endTime}`}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              booking.status === "confirmed"
                                ? "default"
                                : booking.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              {booking.status === "pending" && (
                                <DropdownMenuItem onClick={() => updateBooking(booking.id, { status: "confirmed" })}>
                                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                </DropdownMenuItem>
                              )}
                              {booking.status !== "cancelled" && booking.status !== "completed" && (
                                <DropdownMenuItem onClick={() => cancelBooking(booking.id)}>
                                  <XCircle className="mr-2 h-4 w-4" /> Cancel
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => alert("View details not implemented")}>
                                View details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={clearAllBookings}>
              Clear All Bookings (Debug)
            </Button>
          </CardFooter>
        </Card>

        {/* Members Management */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Members</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  className="pl-8"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>
              <Select
                value={memberStatusFilter}
                onValueChange={(value: MemberStatus | "all") => setMemberStatusFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  setEditingMember(undefined)
                  setIsMemberFormOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Invite Member
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.company}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.status === "active"
                              ? "default"
                              : member.status === "pending"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditMember(member)}>Edit</DropdownMenuItem>
                            {member.status === "active" ? (
                              <DropdownMenuItem onClick={() => updateMember(member.id, { status: "inactive" })}>
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => updateMember(member.id, { status: "active" })}>
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove ${member.name}?`)) removeMember(member.id)
                              }}
                            >
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Resources Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Resources</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  className="pl-8"
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                />
              </div>
              <Select
                value={resourceTypeFilter}
                onValueChange={(value: string | "all") => setResourceTypeFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Meeting Room">Meeting Room</SelectItem>
                  <SelectItem value="Phone Booth">Phone Booth</SelectItem>
                  <SelectItem value="Projector">Projector</SelectItem>
                  <SelectItem value="Whiteboard">Whiteboard</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  setEditingResource(undefined)
                  setIsResourceFormOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Resource
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No resources found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <Image
                          src={resource.imageUrl || "/placeholder.svg?height=50&width=50"}
                          alt={resource.name}
                          width={50}
                          height={50}
                          className="rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{resource.name}</TableCell>
                      <TableCell>{resource.type}</TableCell>
                      <TableCell>{resource.capacity || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            resource.status === "available"
                              ? "default"
                              : resource.status === "in-use"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {resource.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditResource(resource)}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove ${resource.name}?`))
                                  removeResource(resource.id)
                              }}
                            >
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <MemberFormDialog
          open={isMemberFormOpen}
          onOpenChange={setIsMemberFormOpen}
          member={editingMember}
          onSave={handleSaveMember}
        />
        <ResourceFormDialog
          open={isResourceFormOpen}
          onOpenChange={setIsResourceFormOpen}
          resource={editingResource}
          onSave={handleSaveResource}
        />
      </main>
    </div>
  )
}
