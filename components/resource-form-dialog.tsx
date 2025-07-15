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
import { Textarea } from "@/components/ui/textarea"
import type { Resource } from "@/contexts/admin-data-context"

interface ResourceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource?: Resource // Optional, for editing existing resource
  onSave: (resource: Omit<Resource, "id" | "status"> | Resource) => void
}

export function ResourceFormDialog({ open, onOpenChange, resource, onSave }: ResourceFormDialogProps) {
  const [name, setName] = useState(resource?.name || "")
  const [type, setType] = useState<Resource["type"]>(resource?.type || "meeting_room")
  const [capacity, setCapacity] = useState(resource?.capacity || 1)
  const [location, setLocation] = useState(resource?.location || "")
  const [description, setDescription] = useState(resource?.description || "")
  const [status, setStatus] = useState<Resource["status"]>(resource?.status || "available")

  useEffect(() => {
    if (resource) {
      setName(resource.name)
      setType(resource.type)
      setCapacity(resource.capacity)
      setLocation(resource.location)
      setDescription(resource.description || "")
      setStatus(resource.status)
    } else {
      // Reset form for new resource
      setName("")
      setType("meeting_room")
      setCapacity(1)
      setLocation("")
      setDescription("")
      setStatus("available")
    }
  }, [resource, open])

  const handleSubmit = () => {
    const resourceData = {
      name,
      type,
      capacity,
      location,
      description,
      status,
    }

    if (resource) {
      // Editing existing resource
      onSave({ ...resource, ...resourceData })
    } else {
      // Adding new resource
      onSave(resourceData)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{resource ? "Edit Resource" : "Add New Resource"}</DialogTitle>
          <DialogDescription>
            {resource ? "Make changes to the resource details here." : "Fill in the details for the new resource."}
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
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select value={type} onValueChange={(value: Resource["type"]) => setType(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting_room">Meeting Room</SelectItem>
                <SelectItem value="phone_booth">Phone Booth</SelectItem>
                <SelectItem value="desk">Desk</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
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
              onChange={(e) => setCapacity(Number.parseInt(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={(value: Resource["status"]) => setStatus(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
              </SelectContent>
            </Select>
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
