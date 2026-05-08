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
  /** Omit for “add”; include with `id` for edit */
  resource?: Resource | null
  onSave: (resource: Omit<Resource, "id"> | Resource) => void | Promise<void>
}

export function ResourceFormDialog({ open, onOpenChange, resource, onSave }: ResourceFormDialogProps) {
  const isEdit = Boolean(resource?.id)
  const [name, setName] = useState("")
  const [type, setType] = useState("meeting_room")
  const [capacity, setCapacity] = useState(1)
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [amenitiesText, setAmenitiesText] = useState("")
  const [status, setStatus] = useState("available")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setError("")
    if (resource?.id) {
      setName(resource.name)
      setType(resource.type)
      setCapacity(resource.capacity)
      setLocation(resource.location)
      setDescription(resource.description || "")
      setAmenitiesText((resource.amenities ?? []).join(", "))
      setStatus(resource.status)
    } else {
      setName("")
      setType("meeting_room")
      setCapacity(1)
      setLocation("")
      setDescription("")
      setAmenitiesText("")
      setStatus("available")
    }
  }, [resource, open])

  async function handleSubmit() {
    setError("")
    const n = name.trim()
    const loc = location.trim()
    if (!n) {
      setError("Name is required.")
      return
    }
    if (!loc) {
      setError("Location is required.")
      return
    }
    const cap = Number(capacity)
    if (!Number.isFinite(cap) || cap < 1) {
      setError("Capacity must be at least 1.")
      return
    }

    const payload: Omit<Resource, "id"> = {
      name: n,
      type,
      capacity: Math.floor(cap),
      location: loc,
      description: description.trim(),
      status,
      amenities: amenitiesText
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    }

    setSaving(true)
    try {
      if (isEdit && resource?.id) {
        await Promise.resolve(onSave({ ...payload, id: resource.id } as Resource))
      } else {
        await Promise.resolve(onSave(payload))
      }
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Resource" : "Add New Resource"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update resource details." : "Create a bookable resource."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
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
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting_room">Meeting Room</SelectItem>
                <SelectItem value="phone_booth">Phone Booth</SelectItem>
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
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(Number.parseInt(e.target.value, 10) || 1)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Location
            </Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="col-span-3" />
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
            <Select value={status} onValueChange={setStatus}>
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amenities" className="text-right">
              Amenities
            </Label>
            <Input
              id="amenities"
              value={amenitiesText}
              onChange={(e) => setAmenitiesText(e.target.value)}
              placeholder="Projector, Whiteboard"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add resource"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
