
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
import { Resource, useAdminData, Member } from "@/contexts/admin-data-context"
import { useBooking } from "@/contexts/booking-context"
import { useSearchParams } from "next/navigation";
import { ResourceFormDialog } from "@/components/resource-form-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MemberFormDialog } from "@/components/member-form-dialog";
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

// Map string icon names to Lucide React components
const iconMap: { [key: string]: LucideIcon } = {
  Calendar: Calendar,
  Users: Users,
  TrendingUp: TrendingUp,
  Building2: Building2,
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [openDialog, setOpenDialog] = useState(false)
  const [editResource, setEditResource] = useState<Resource | null>(null);
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null);
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("all");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("all");
  const [memberStatusFilter, setMemberStatusFilter] = useState("all");
  const [editMember, setEditMember] = useState<any | null>(null); // Changed to any as Member type is removed
  const [showDeleteMemberId, setShowDeleteMemberId] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Use data from contexts
  const { members, resources, isLoaded: adminDataLoaded, updateResource, deleteResource, addResource, updateMember, addMember, deleteMember } = useAdminData();
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

  const { user, loading } = useAuth();
  const router = useRouter();

  // Auth protection
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-2">Loading Admin Dashboard...</h1>
          <p className="text-gray-500 mb-6 text-center">Please wait while we check your access</p>
        </div>
      </div>
    );
  }

  // List of admin emails
  const adminEmails = ["admin@example.com", "ayesha.azhar.shaikh@gmail.com"];
  if (user && !(adminEmails.includes(user.email) || ("role" in user && user.role === "admin"))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-2 text-red-600">Access Denied</h1>
          <p className="text-gray-500 mb-6 text-center">You do not have permission to view the admin dashboard.</p>
        </div>
      </div>
    );
  }

  const resourceTypeOptions = [
    { value: "all", label: "All Types" },
    { value: "meeting_room", label: "Meeting Rooms" },
    { value: "phone_booth", label: "Phone Booths" },
    { value: "equipment", label: "Equipment" },
    { value: "desk", label: "Desks" },
  ];

  const memberRoleOptions = [
    { value: "all", label: "All Roles" },
    { value: "member", label: "Member" },
    { value: "admin", label: "Admin" },
  ];
  const memberStatusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "pending", label: "Pending" },
  ];

  // In the Members table, use member.role || 'member' and member.status || 'active' for fallback
  // For badge variant, map status to a valid variant
  const getMemberStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "inactive":
        return "destructive";
      default:
        return "secondary";
    }
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
                          const member = members.find((m) => m.id === booking.userId)
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
                          const member = members.find((m) => m.id === booking.userId)
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
                    <Button onClick={() => setInviteDialogOpen(true)}><UserPlus className="mr-2 h-4 w-4" />Invite Member</Button>
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search members..."
                        value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={memberRoleFilter} onValueChange={setMemberRoleFilter}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {memberRoleOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={memberStatusFilter} onValueChange={setMemberStatusFilter}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {memberStatusOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members
                        .filter(member => {
                          const q = memberSearch.toLowerCase();
                          const matchesRole = memberRoleFilter === "all" || ((member as any).role || 'member') === memberRoleFilter;
                          const matchesStatus = memberStatusFilter === "all" || ((member as any).status || 'active') === memberStatusFilter;
                          return (
                            matchesRole && matchesStatus && (
                              (member.name && member.name.toLowerCase().includes(q)) ||
                              (member.email && member.email.toLowerCase().includes(q)) ||
                              (member.company && member.company.toLowerCase().includes(q)) ||
                              (member.department && member.department.toLowerCase().includes(q))
                            )
                          );
                        })
                        .map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>{member.name}</TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>{member.company}</TableCell>
                            <TableCell>{member.department}</TableCell>
                            <TableCell>{(member as any).role || 'Member'}</TableCell>
                            <TableCell><Badge variant={getMemberStatusVariant((member as any).status || 'active')}>{(member as any).status || 'active'}</Badge></TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost">
                                    <MoreHorizontal className="h-5 w-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditMember(member)}>Edit</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={() => setShowDeleteMemberId(member.id)}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  {/* Edit/Add Member Dialog */}
                  <MemberFormDialog
                    open={!!editMember}
                    onOpenChange={(open) => { if (!open) setEditMember(null); }}
                    member={editMember || undefined}
                    onSave={(data) => {
                      if (editMember && editMember.id) {
                        // update member
                        updateMember(editMember.id, data);
                      } else {
                        // add member
                        addMember(data as Omit<Member, "id" | "status" | "totalBookings" | "role">);
                      }
                      setEditMember(null);
                    }}
                  />
                  {/* Invite Member Dialog */}
                  <MemberFormDialog
                    open={inviteDialogOpen}
                    onOpenChange={setInviteDialogOpen}
                    onSave={(data) => {
                      // Add as pending (status will be set by provider)
                      addMember(data as Omit<Member, "id" | "status" | "totalBookings" | "role">);
                      setInviteDialogOpen(false);
                    }}
                  />
                  {/* Delete Confirmation Dialog */}
                  {showDeleteMemberId && (
                    <Dialog open={!!showDeleteMemberId} onOpenChange={(open) => !open && setShowDeleteMemberId(null)}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Member</DialogTitle>
                          <DialogDescription>Are you sure you want to delete this member? This action cannot be undone.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowDeleteMemberId(null)}>Cancel</Button>
                          <Button variant="destructive" onClick={() => { deleteMember(showDeleteMemberId!); setShowDeleteMemberId(null); }}>Delete</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
                    <Button onClick={() => setEditResource({} as Resource)}><Plus className="mr-2 h-4 w-4" />Add Resource</Button>
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search resources..."
                        value={resourceSearch}
                        onChange={e => setResourceSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {resourceTypeOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resources
                        .filter(resource => {
                          const q = resourceSearch.toLowerCase();
                          const matchesType = resourceTypeFilter === "all" || resource.type === resourceTypeFilter;
                          return (
                            matchesType && (
                              (resource.name && resource.name.toLowerCase().includes(q)) ||
                              (resource.type && resource.type.toLowerCase().includes(q)) ||
                              (resource.location && resource.location.toLowerCase().includes(q)) ||
                              (resource.description && resource.description.toLowerCase().includes(q))
                            )
                          );
                        })
                        .map((resource) => (
                          <TableRow key={resource.id}>
                            <TableCell>{resource.name}</TableCell>
                            <TableCell>{resource.type.replace(/_/g, " ")}</TableCell>
                            <TableCell>{resource.capacity}</TableCell>
                            <TableCell><Badge variant={resource.status === "available" ? "default" : resource.status === "maintenance" ? "destructive" : "outline"}>{resource.status}</Badge></TableCell>
                            <TableCell>{resource.location}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost">
                                    <MoreHorizontal className="h-5 w-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditResource(resource)}>Edit</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={() => setShowDeleteId(resource.id)}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  {/* Edit Resource Dialog */}
                  <ResourceFormDialog
                    open={!!editResource}
                    onOpenChange={(open) => {
                      if (!open) setEditResource(null);
                    }}
                    resource={editResource || undefined}
                    onSave={(data) => {
                      if (editResource && editResource.id) {
                        updateResource(editResource.id, data);
                      } else {
                        addResource(data as Omit<Resource, "id">);
                      }
                      setEditResource(null);
                    }}
                  />
                  {/* Delete Confirmation Dialog */}
                  {showDeleteId && (
                    <Dialog open={!!showDeleteId} onOpenChange={(open) => !open && setShowDeleteId(null)}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Resource</DialogTitle>
                          <DialogDescription>Are you sure you want to delete this resource? This action cannot be undone.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowDeleteId(null)}>Cancel</Button>
                          <Button variant="destructive" onClick={() => { deleteResource(showDeleteId!); setShowDeleteId(null); }}>Delete</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
