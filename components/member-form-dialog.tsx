"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Member } from "@/contexts/admin-data-context"

interface MemberFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member?: Member // Optional, for editing existing member
  onSave: (member: Omit<Member, "id" | "joinDate" | "totalBookings" | "status" | "role"> | Member) => void
}

export function MemberFormDialog({ open, onOpenChange, member, onSave }: MemberFormDialogProps) {
  const [name, setName] = useState(member?.name || "")
  const [email, setEmail] = useState(member?.email || "")
  const [company, setCompany] = useState(member?.company || "")
  const [department, setDepartment] = useState(member?.department || "")
  const [phone, setPhone] = useState(member?.phone || "")
  const [role, setRole] = useState<Member["role"]>(member?.role || "member")
  const [status, setStatus] = useState<Member["status"]>(member?.status || "active")

  useEffect(() => {
    if (member) {
      setName(member.name)
      setEmail(member.email)
      setCompany(member.company)
      setDepartment(member.department)
      setPhone(member.phone)
      setRole(member.role)
      setStatus(member.status)
    } else {
      // Reset form for new member
      setName("")
      setEmail("")
      setCompany("")
      setDepartment("")
      setPhone("")
      setRole("member")
      setStatus("active")
    }
  }, [member, open])

  const handleSubmit = () => {
    const memberData = {
      name,
      email,
      company,
      department,
      phone,
      role,
      status,
    }

    if (member) {
      // Editing existing member
      onSave({ ...member, ...memberData })
    } else {
      // Adding new member
      onSave(memberData)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{member ? "Edit Member" : "Add New Member"}</DialogTitle>
          <DialogDescription>
            {member ? "Make changes to the member's profile here." : "Fill in the details for the new member."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">
              Company
            </Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">
              Department
            </Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select value={role} onValueChange={(value: Member["role"]) => setRole(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={(value: Member["status"]) => setStatus(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            {member ? "Save changes" : "Add Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
