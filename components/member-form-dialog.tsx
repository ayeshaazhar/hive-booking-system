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
  member?: Member
  onSave: (member: Omit<Member, "id" | "joinDate" | "totalBookings"> | Member) => void | Promise<void>
}

export function MemberFormDialog({ open, onOpenChange, member, onSave }: MemberFormDialogProps) {
  const [name, setName] = useState(member?.name || "")
  const [email, setEmail] = useState(member?.email || "")
  const [company, setCompany] = useState(member?.company || "")
  const [department, setDepartment] = useState(member?.department || "")
  const [phone, setPhone] = useState(member?.phone || "")
  const [role, setRole] = useState<string>(member?.role || "member")
  const [status, setStatus] = useState<string>(member?.status || "active")

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

  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setError("")
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.")
      return
    }
    const memberData = {
      name: name.trim(),
      email: email.trim(),
      company: company.trim(),
      department: department.trim(),
      phone: phone.trim(),
      role,
      status,
    }
    setSaving(true)
    try {
      if (member?.id) {
        await Promise.resolve(onSave({ ...member, ...memberData }))
      } else {
        await Promise.resolve(onSave(memberData as Omit<Member, "id" | "joinDate" | "totalBookings">))
      }
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save member.")
    } finally {
      setSaving(false)
    }
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
          {error && <p className="text-sm text-red-600 col-span-4">{error}</p>}
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
            <Select value={role} onValueChange={(value) => setRole(value)}>
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
            <Select value={status} onValueChange={(value) => setStatus(value)}>
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
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? "Saving…" : member ? "Save changes" : "Add Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
