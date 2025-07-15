"use client"

import * as React from "react"
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
import type { Member, MemberStatus } from "@/contexts/admin-data-context"

interface MemberFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member?: Member // Optional: if editing an existing member
  onSave: (member: Omit<Member, "id" | "createdAt">) => void
}

export function MemberFormDialog({ open, onOpenChange, member, onSave }: MemberFormDialogProps) {
  const [name, setName] = React.useState(member?.name || "")
  const [email, setEmail] = React.useState(member?.email || "")
  const [company, setCompany] = React.useState(member?.company || "")
  const [status, setStatus] = React.useState<MemberStatus>(member?.status || "pending")

  React.useEffect(() => {
    if (member) {
      setName(member.name)
      setEmail(member.email)
      setCompany(member.company)
      setStatus(member.status)
    } else {
      // Reset form when dialog opens for new member
      setName("")
      setEmail("")
      setCompany("")
      setStatus("pending")
    }
  }, [open, member])

  const handleSubmit = () => {
    if (!name || !email || !company) {
      alert("Please fill in all required fields.")
      return
    }
    onSave({ name, email, company, status })
    onOpenChange(false) // Close dialog on save
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{member ? "Edit Member" : "Invite New Member"}</DialogTitle>
          <DialogDescription>
            {member ? "Make changes to this member's profile." : "Fill in the details to invite a new member."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
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
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">
              Company
            </Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={(value: MemberStatus) => setStatus(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
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
            {member ? "Save changes" : "Invite Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
