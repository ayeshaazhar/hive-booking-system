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
import type { AdminBooking } from "@/contexts/admin-data-context"

const timeSlots = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM",
]

const durations = ["30 minutes", "1 hour", "1.5 hours", "2 hours", "3 hours", "4 hours"]

function toSlotFromDate(d: Date): string {
  let h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? "PM" : "AM"
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`
}

function addMinutesToDate(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60_000)
}

export function AdminBookingEditDialog({
  open,
  onOpenChange,
  booking,
  allBookings,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: AdminBooking | null
  allBookings: AdminBooking[]
  onSave: (updates: { startTime: string; endTime: string; purpose?: string; status?: string }) => Promise<void>
}) {
  const [date, setDate] = useState("")
  const [time, setTime] = useState("9:00 AM")
  const [duration, setDuration] = useState("1 hour")
  const [purpose, setPurpose] = useState("")
  const [status, setStatus] = useState("confirmed")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !booking) return
    const start = new Date(booking.startTime)
    const end = new Date(booking.endTime)
    setDate(start.toISOString().split("T")[0])
    setTime(toSlotFromDate(start))
    const diffMin = Math.round((end.getTime() - start.getTime()) / 60_000)
    const match = durations.find((d) => {
      let min = 0
      if (d.includes("hour")) min = Number.parseFloat(d.replace(/[^\d.]/g, "")) * 60
      else if (d.includes("minute")) min = Number.parseInt(d.replace(/[^\d]/g, ""), 10)
      return Math.abs(min - diffMin) < 2
    })
    setDuration(match || `${diffMin} minutes`)
    setPurpose(booking.purpose || "")
    setStatus(booking.status)
    setError("")
  }, [open, booking])

  function parseSlotOnDate(slot: string, dateStr: string): Date {
    const [timePart, ampmPart] = slot.split(" ")
    let [hours, minutes] = timePart.split(":").map(Number)
    if (ampmPart === "PM" && hours !== 12) hours += 12
    if (ampmPart === "AM" && hours === 12) hours = 0
    const [y, mo, day] = dateStr.split("-").map(Number)
    return new Date(y, mo - 1, day, hours, minutes, 0, 0)
  }

  function durationToMinutes(dur: string): number {
    if (dur.includes("hour")) return Number.parseFloat(dur.replace(/[^\d.]/g, "")) * 60
    if (dur.includes("minute")) return Number.parseInt(dur.replace(/[^\d]/g, ""), 10)
    return 60
  }

  function overlapsOthers(start: Date, end: Date): boolean {
    if (!booking) return false
    return allBookings.some((b) => {
      if (b.id === booking.id || b.status === "cancelled") return false
      if (b.resourceId !== booking.resourceId) return false
      if (!["confirmed", "pending"].includes(b.status)) return false
      const bs = new Date(b.startTime).getTime()
      const be = new Date(b.endTime).getTime()
      return start.getTime() < be && end.getTime() > bs
    })
  }

  async function handleSave() {
    if (!booking) return
    setError("")
    const start = parseSlotOnDate(time, date)
    const end = addMinutesToDate(start, durationToMinutes(duration))
    if (Number.isNaN(start.getTime())) {
      setError("Invalid date or time.")
      return
    }
    if (overlapsOthers(start, end)) {
      setError("This range overlaps another active booking for the same resource.")
      return
    }
    setSaving(true)
    try {
      await onSave({
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        purpose: purpose.trim() || undefined,
        status,
      })
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit booking</DialogTitle>
          <DialogDescription>Adjust time, status, or purpose. Conflicts are blocked.</DialogDescription>
        </DialogHeader>
        {booking && (
          <div className="space-y-4 py-2">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Start time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Purpose</Label>
              <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} className="mt-1" rows={2} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || !booking}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
