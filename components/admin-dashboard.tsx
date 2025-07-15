"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { PlusCircle, Edit, Trash2, CheckCircle, XCircle, MoreHorizontal } from "lucide-react"
import { useAdminData, type Member, type Resource } from "@/contexts/admin-data-context"
import { useBooking, type Booking } from "@/contexts/booking-context"
import { MemberFormDialog } from "@/components/member-form-dialog"
import { ResourceFormDialog } from "@/components/resource-form-dialog"
import { formatTimeForDisplay } from "@/lib/date-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function AdminDashboard() {
  const {
    members,
    resources,
    addMember,
    updateMember,
    deleteMember,
    addResource,
    updateResource,
    deleteResource,
    isLoaded: adminDataLoaded,
  } = useAdminData()
  const { bookings, updateBooking, deleteBooking, getBookingDetails, isLoaded: bookingDataLoaded } = useBooking()

  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | undefined>(undefined)
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | undefined>(undefined)

  if (!adminDataLoaded || !bookingDataLoaded) {
    return <div className="p-4 text-center">Loading admin data...</div>
  }

  const handleAddMember = () => {
    setEditingMember(undefined)
    setIsMemberDialogOpen(true)
  }

  const handleEditMember = (member: Member) => {
    setEditingMember(member)
    setIsMemberDialogOpen(true)
  }

  const handleSaveMember = (
    memberData: Omit<Member, "id" | "joinDate" | "totalBookings" | "status" | "role"> | Member,
  ) => {
    if ((memberData as Member).id) {
      updateMember((memberData as Member).id, memberData as Partial<Member>)
    } else {
      addMember(memberData as Omit<Member, "id" | "joinDate" | "totalBookings" | "status" | "role">)
    }
  }

  const handleAddResource = () => {
    setEditingResource(undefined)
    setIsResourceDialogOpen(true)
  }

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource)
    setIsResourceDialogOpen(true)
  }

  const handleSaveResource = (resourceData: Omit<Resource, "id" | "status"> | Resource) => {
    if ((resourceData as Resource).id) {
      updateResource((resourceData as Resource).id, resourceData as Partial<Resource>)
    } else {
      addResource(resourceData as Omit<Resource, "id" | "status">)
    }
  }

  const handleUpdateBookingStatus = (bookingId: string, status: Booking["status"]) => {
    updateBooking(bookingId, { status })
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No bookings found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((booking) => {
                      const { resource, member } = getBookingDetails(booking)
                      return (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{resource?.name || "N/A"}</TableCell>
                          <TableCell>{member?.name || "N/A"}</TableCell>
                          <TableCell>
                            {formatTimeForDisplay(booking.startTime)} - {formatTimeForDisplay(booking.endTime)}
                          </TableCell>
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
                                {booking.status === "pending" && (
                                  <DropdownMenuItem onClick={() => handleUpdateBookingStatus(booking.id, "confirmed")}>
                                    <CheckCircle className="mr-2 h-4 w-4" /> Confirm
                                  </DropdownMenuItem>
                                )}
                                {booking.status !== "cancelled" && (
                                  <DropdownMenuItem onClick={() => handleUpdateBookingStatus(booking.id, "cancelled")}>
                                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => deleteBooking(booking.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
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
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All Members</CardTitle>
              <Button size="sm" onClick={handleAddMember}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Member
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No members found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.image || "/placeholder.svg"} alt={member.name} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {member.name}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.company}</TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              member.status === "active"
                                ? "default"
                                : member.status === "inactive"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditMember(member)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit member</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMember(member.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete member</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <MemberFormDialog
            open={isMemberDialogOpen}
            onOpenChange={setIsMemberDialogOpen}
            member={editingMember}
            onSave={handleSaveMember}
          />
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All Resources</CardTitle>
              <Button size="sm" onClick={handleAddResource}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Resource
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No resources found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    resources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="font-medium">{resource.name}</TableCell>
                        <TableCell>{resource.type.replace(/_/g, " ")}</TableCell>
                        <TableCell>{resource.capacity}</TableCell>
                        <TableCell>{resource.location}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              resource.status === "available"
                                ? "default"
                                : resource.status === "maintenance"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {resource.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditResource(resource)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit resource</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteResource(resource.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete resource</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <ResourceFormDialog
            open={isResourceDialogOpen}
            onOpenChange={setIsResourceDialogOpen}
            resource={editingResource}
            onSave={handleSaveResource}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
