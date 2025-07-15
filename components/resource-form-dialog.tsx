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
import { Textarea } from "@/components/ui/textarea"
import type { Resource, ResourceStatus, ResourceType } from "@/contexts/admin-data-context"

interface ResourceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource?: Resource // Optional: if editing an existing resource
  onSave: (resource: Omit<Resource, "id" | "createdAt">) => void
}

export function ResourceFormDialog({ open, onOpenChange, resource, onSave }: ResourceFormDialogProps) {
  const [name, setName] = React.useState(resource?.name || "")
  const [type, setType] = React.useState<ResourceType>(resource?.type || "Other")
  const [capacity, setCapacity] = React.useState(resource?.capacity?.toString() || "")
  const [amenities, setAmenities] = React.useState(resource?.amenities?.join(", ") || "")
  const [status, setStatus] = React.useState<ResourceStatus>(resource?.status || "available")
  const [imageUrl, setImageUrl] = React.useState(resource?.imageUrl || "/placeholder.svg?height=100&width=100")

  React.useEffect(() => {
    if (resource) {
      setName(resource.name)
      setType(resource.type)
      setCapacity(resource.capacity?.toString() || "")
      setAmenities(resource.amenities?.join(", ") || "")
      setStatus(resource.status)
      setImageUrl(resource.imageUrl || "/placeholder.svg?height=100&width=100")
    } else {
      // Reset form when dialog opens for new resource
      setName("")
      setType("Other")
      setCapacity("")
      setAmenities("")
      setStatus("available")
      setImageUrl("/placeholder.svg?height=100&width=100")
    }
  }, [open, resource])

  const handleSubmit = () => {
    if (!name) {
      alert("Resource name is required.")
      return
    }
    onSave({
      name,
      type,
      capacity: capacity ? Number.parseInt(capacity) : undefined,
      amenities: amenities ? amenities.split(",").map((s) => s.trim()) : [],
      status,
      imageUrl,
    })
    onOpenChange(false) // Close dialog on save
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{resource ? "Edit Resource" : "Add New Resource"}</DialogTitle>
          <DialogDescription>
            {resource ? "Make changes to this resource." : "Fill in the details to add a new resource."}
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
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select value={type} onValueChange={(value: ResourceType) => setType(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Meeting Room">Meeting Room</SelectItem>
                <SelectItem value="Phone Booth">Phone Booth</SelectItem>
                <SelectItem value="Projector">Projector</SelectItem>
                <SelectItem value="Whiteboard">Whiteboard</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="capacity" className="text-right">
              Capacity
            </Label>
            <Input
              id="capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amenities" className="text-right">
              Amenities
            </Label>
            <Textarea
              id="amenities"
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              placeholder="Comma-separated list (e.g., Projector, Whiteboard)"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={(value: ResourceStatus) => setStatus(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in-use">In Use</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="imageUrl" className="text-right">
              Image URL
            </Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            {resource ? "Save changes" : "Add Resource"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
