import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "@/lib/prisma"
import { isUserAdmin } from "@/lib/admin-server"
import { createBookingAuditLog, createNotification } from "@/lib/booking-events"
import { getUserWithOrganizationByEmail } from "@/lib/organization"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !(await isUserAdmin(session.user.email))) {
    return null
  }
  return session
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const existing = await prisma.booking.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }
  const actor = await getUserWithOrganizationByEmail(session.user.email!)

  const nextStart =
    typeof body.startTime === "string" ? new Date(body.startTime) : existing.startTime
  const nextEnd = typeof body.endTime === "string" ? new Date(body.endTime) : existing.endTime

  if (typeof body.startTime === "string" && Number.isNaN(nextStart.getTime())) {
    return NextResponse.json({ error: "Invalid startTime" }, { status: 400 })
  }
  if (typeof body.endTime === "string" && Number.isNaN(nextEnd.getTime())) {
    return NextResponse.json({ error: "Invalid endTime" }, { status: 400 })
  }
  if (nextEnd <= nextStart) {
    return NextResponse.json({ error: "endTime must be after startTime" }, { status: 400 })
  }

  const timesChange = typeof body.startTime === "string" || typeof body.endTime === "string"

  const data: {
    status?: string
    purpose?: string | null
    notes?: string | null
    startTime?: Date
    endTime?: Date
  } = {}

  if (typeof body.status === "string") {
    const s = body.status
    if (["pending", "confirmed", "cancelled", "completed"].includes(s)) data.status = s
  }
  if (typeof body.purpose === "string") data.purpose = body.purpose
  if (body.purpose === null) data.purpose = null
  if (typeof body.notes === "string") data.notes = body.notes
  if (body.notes === null) data.notes = null
  if (typeof body.startTime === "string") data.startTime = nextStart
  if (typeof body.endTime === "string") data.endTime = nextEnd

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (timesChange) {
        await tx.$queryRaw`SELECT id FROM "Resource" WHERE id = ${existing.resourceId} FOR UPDATE`
        const overlapping = await tx.booking.findFirst({
          where: {
            id: { not: params.id },
            resourceId: existing.resourceId,
            organizationId: existing.organizationId ?? undefined,
            status: { in: ["confirmed", "pending"] },
            startTime: { lt: nextEnd },
            endTime: { gt: nextStart },
          },
        })
        if (overlapping) throw new Error("BOOKING_CONFLICT")
      }

      return tx.booking.update({
        where: { id: params.id },
        data,
        include: { user: true, resource: true },
      })
    })

    await createBookingAuditLog({
      bookingId: updated.id,
      action: "admin_updated",
      actorUserId: actor?.id,
      snapshot: { before: existing, after: updated },
    })
    if (existing.status !== updated.status) {
      const readable = updated.status.charAt(0).toUpperCase() + updated.status.slice(1)
      await createNotification({
        organizationId: updated.organizationId,
        recipientId: updated.userId,
        type: `booking_${updated.status}`,
        title: `Booking ${readable}`,
        message: `An admin changed your booking status to ${updated.status}.`,
        metadata: { bookingId: updated.id, status: updated.status },
      })
      await createNotification({
        organizationId: updated.organizationId,
        recipientId: null,
        type: "booking_admin_status_change",
        title: "Booking status updated",
        message: `Admin changed booking ${updated.id} from ${existing.status} to ${updated.status}.`,
        metadata: { bookingId: updated.id, from: existing.status, to: updated.status },
      })
    } else if (timesChange) {
      await createNotification({
        organizationId: updated.organizationId,
        recipientId: updated.userId,
        type: "booking_updated",
        title: "Booking updated",
        message: "An admin updated the date/time of your booking.",
        metadata: { bookingId: updated.id, startTime: updated.startTime, endTime: updated.endTime },
      })
    }
    return NextResponse.json(updated)
  } catch (e) {
    if (e instanceof Error && e.message === "BOOKING_CONFLICT") {
      await createNotification({
        organizationId: existing.organizationId,
        recipientId: existing.userId,
        type: "booking_conflict",
        title: "Booking update blocked",
        message: "The requested time overlaps another booking for this resource.",
        metadata: { bookingId: existing.id, resourceId: existing.resourceId },
      })
      return NextResponse.json(
        { error: "That time range overlaps another booking for this resource." },
        { status: 409 },
      )
    }
    console.error("[bookings PATCH]", e)
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const existing = await prisma.booking.findUnique({ where: { id: params.id } })
    await prisma.booking.delete({ where: { id: params.id } })
    if (existing) {
      const actor = await getUserWithOrganizationByEmail(session.user.email!)
      await createBookingAuditLog({
        bookingId: existing.id,
        action: "admin_deleted",
        actorUserId: actor?.id,
        snapshot: existing as unknown as Record<string, unknown>,
      })
      await createNotification({
        organizationId: existing.organizationId,
        recipientId: existing.userId,
        type: "booking_deleted",
        title: "Booking removed",
        message: "An admin removed one of your bookings.",
        metadata: { bookingId: existing.id, resourceId: existing.resourceId },
      })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[bookings DELETE]", e)
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 })
  }
}
