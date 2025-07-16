
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
  Filter,
  Download,
  UserPlus,
  Building2,
  type LucideIcon,
} from "lucide-react"
import { useAdminData } from "@/contexts/admin-data-context"
import { useBooking } from "@/contexts/booking-context"
import { useSearchParams } from "next/navigation";

// Map string icon names to Lucide React components
const iconMap: { [key: string]: LucideIcon } = {
  Calendar: Calendar,
  Users: Users,
  TrendingUp: TrendingUp,
  Building2: Building2,
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  // Use data from contexts
  const { members, resources, isLoaded: adminDataLoaded } = useAdminData()
  const { bookings, isLoaded: bookingDataLoaded } = useBooking()

  const isLoaded = adminDataLoaded && bookingDataLoaded // Combined loading state

  // Derive bookingStats from context data
  const bookingStats = useMemo(() => {
    if (!isLoaded) return []

    const activeMembersCount = members.filter((m) => m.status === "active").length
    const availableResourcesCount = resources.filter((r) => r.status === "available").length

    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD
    const totalBookingsTodayCount = bookings.filter((b) => b.startTime.startsWith(today)).length

    // Room Utilization is complex to calculate accurately without more data, keeping it static for now
    const roomUtilization = "78%"

    return [
      { title: "Total Bookings Today", value: totalBookingsTodayCount.toString(), change: "+12%", icon: Calendar },
      { title: "Active Members", value: activeMembersCount.toString(), change: "+5%", icon: Users },
      { title: "Room Utilization", value: roomUtilization, change: "+8%", icon: TrendingUp },
      { title: "Available Resources", value: availableResourcesCount.toString(), change: "0%", icon: Building2 },
    ]
  }, [members, resources, bookings, isLoaded])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
      case "active":
      case "available":
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "cancelled":
      case "inactive":
      case "maintenance":
        return "destructive"
      case "booked":
        return "outline"
      default:
        return "secondary"
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Loading dashboard data...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Removed: <TopNavigation /> */}
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage bookings, members, and resources</p>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {bookingStats.length > 0 ? (
                  bookingStats.map((stat) => {
                    // const Icon = iconMap[stat.icon]
                    return (
                      <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                          {/* {Icon && <Icon className="h-4 w-4 text-muted-foreground" />} */}
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stat.value}</div>
                          <p className="text-xs text-muted-foreground">{stat.change} from last month</p>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <p>No stats available</p>
                )}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Latest booking activity across all resources</CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Resource</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking) => {
                          const member = members.find((m) => m.id === booking.memberId)
                          const resource = resources.find((r) => r.id === booking.resourceId)
                          return (
                            <TableRow key={booking.id}>
                              <TableCell className="font-medium">{member?.name || "N/A"}</TableCell>
                              <TableCell>{resource?.name || "N/A"}</TableCell>
                              <TableCell>
                                <div>
                                  <div>{new Date(booking.startTime).toLocaleDateString()}</div>
                                  <div className="text-sm text-gray-500">
                                    {new Date(booking.startTime).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}{" "}
                                    -{" "}
                                    {new Date(booking.endTime).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusColor(booking.status)}>{booking.status}</Badge>
                              </TableCell>
                              <TableCell>{booking.purpose || "N/A"}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>Approve</DropdownMenuItem>
                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">Cancel</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p>No bookings data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>All Bookings</CardTitle>
                      <CardDescription>Manage all member bookings</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Search bookings..." className="pl-10" />
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {bookings.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Resource</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking) => {
                          const member = members.find((m) => m.id === booking.memberId)
                          const resource = resources.find((r) => r.id === booking.resourceId)
                          return (
                            <TableRow key={booking.id}>
                              <TableCell className="font-medium">{member?.name || "N/A"}</TableCell>
                              <TableCell>{resource?.name || "N/A"}</TableCell>
                              <TableCell>
                                <div>
                                  <div>{new Date(booking.startTime).toLocaleDateString()}</div>
                                  <div className="text-sm text-gray-500">
                                    {new Date(booking.startTime).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}{" "}
                                    -{" "}
                                    {new Date(booking.endTime).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusColor(booking.status)}>{booking.status}</Badge>
                              </TableCell>
                              <TableCell>{booking.purpose || "N/A"}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button size="sm" variant="outline">
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    Edit
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-red-600">
                                    Cancel
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p>No bookings data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Member Management</CardTitle>
                      <CardDescription>Manage Hive members and their access</CardDescription>
                    </div>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Search members..." className="pl-10" />
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Members</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {members.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Join Date</TableHead>
                          <TableHead>Bookings</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">{member.name}</TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>{member.company}</TableCell>
                            <TableCell>{new Date(member.joinDate).toLocaleDateString()}</TableCell>
                            <TableCell>{member.totalBookings}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(member.status)}>{member.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>View Profile</DropdownMenuItem>
                                  <DropdownMenuItem>Reset Password</DropdownMenuItem>
                                  <DropdownMenuItem>
                                    {member.status === "active" ? "Deactivate" : "Activate"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p>No members data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Resource Management</CardTitle>
                      <CardDescription>Manage meeting rooms, phone booths, and equipment</CardDescription>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Resource
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Search resources..." className="pl-10" />
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="meeting_room">Meeting Rooms</SelectItem>
                        <SelectItem value="phone_booth">Phone Booths</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="desk">Desks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {resources.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Today's Bookings</TableHead>
                          <TableHead>Utilization</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resources.map((resource) => (
                          <TableRow key={resource.id}>
                            <TableCell className="font-medium">{resource.name}</TableCell>
                            <TableCell>{resource.type}</TableCell>
                            <TableCell>{resource.capacity}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(resource.status)}>{resource.status}</Badge>
                            </TableCell>
                            <TableCell>{"N/A"}</TableCell> {/* Bookings today not directly in resource context */}
                            <TableCell>{"N/A"}</TableCell> {/* Utilization not directly in resource context */}
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Edit Resource</DropdownMenuItem>
                                  <DropdownMenuItem>View Schedule</DropdownMenuItem>
                                  <DropdownMenuItem>Maintenance Mode</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p>No resources data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
