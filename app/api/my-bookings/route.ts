// app/api/my-bookings/route.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"
import { createBookingAuditLog, createNotification } from "@/lib/booking-events"
import { getUserWithOrganizationByEmail } from "@/lib/organization"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    return NextResponse.json([], { status: 401 })
  }

  try {
    const user = await getUserWithOrganizationByEmail(session.user.email)
    if (!user) return NextResponse.json([])

    const userWithBookings = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        bookings: {
          orderBy: { startTime: "desc" },
          select: {
            id: true,
            userId: true,
            resourceId: true,
            startTime: true,
            endTime: true,
            status: true,
            purpose: true,
            notes: true,
            resource: true,
          },
        },
      },
    })

    if (!userWithBookings || !userWithBookings.bookings) {
      return NextResponse.json([])
    }

    return NextResponse.json(userWithBookings.bookings)
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let raw: Record<string, unknown>
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const dbUser = await getUserWithOrganizationByEmail(session.user.email)
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const resourceId = typeof raw.resourceId === "string" ? raw.resourceId : String(raw.resourceId ?? "")
  const startTimeRaw = raw.startTime
  const endTimeRaw = raw.endTime
  if (!resourceId || typeof startTimeRaw !== "string" || typeof endTimeRaw !== "string") {
    return NextResponse.json(
      { error: "resourceId, startTime, and endTime are required" },
      { status: 400 },
    )
  }

  const startTime = new Date(startTimeRaw)
  const endTime = new Date(endTimeRaw)
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return NextResponse.json({ error: "Invalid start or end time" }, { status: 400 })
  }
  if (endTime <= startTime) {
    return NextResponse.json({ error: "endTime must be after startTime" }, { status: 400 })
  }

  const resourceExists = await prisma.resource.findUnique({ where: { id: resourceId } })
  if (!resourceExists) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 })
  }
  if (resourceExists.organizationId && resourceExists.organizationId !== dbUser.organizationId) {
    return NextResponse.json({ error: "You cannot book this resource" }, { status: 403 })
  }

  const status =
    typeof raw.status === "string" && ["pending", "confirmed", "cancelled", "completed"].includes(raw.status)
      ? raw.status
      : "confirmed"
  const purpose = typeof raw.purpose === "string" ? raw.purpose : undefined
  const notes = typeof raw.notes === "string" ? raw.notes : undefined

  try {
    const booking = await prisma.$transaction(async (tx) => {
      // Resource row lock reduces concurrent overlap races for same resource.
      await tx.$queryRaw`SELECT id FROM "Resource" WHERE id = ${resourceId} FOR UPDATE`

      const overlapping = await tx.booking.findFirst({
        where: {
          resourceId,
          status: { in: ["confirmed", "pending"] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      })
      if (overlapping) {
        throw new Error("BOOKING_CONFLICT")
      }

      const created = await tx.booking.create({
        data: {
          userId: dbUser.id,
          resourceId,
          organizationId: dbUser.organizationId,
          startTime,
          endTime,
          status,
          purpose,
          notes,
        },
        select: {
          id: true,
          userId: true,
          resourceId: true,
          startTime: true,
          endTime: true,
          status: true,
          purpose: true,
          notes: true,
          resource: true,
        },
      })
      return created
    })

    await createBookingAuditLog({
      bookingId: booking.id,
      action: "created",
      actorUserId: dbUser.id,
      snapshot: {
        resourceId: booking.resourceId,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
      },
    })
    await createNotification({
      organizationId: dbUser.organizationId,
      recipientId: dbUser.id,
      type: "booking_created",
      title: "Booking confirmed",
      message: `Your booking was created from ${new Date(booking.startTime).toLocaleString()} to ${new Date(
        booking.endTime,
      ).toLocaleTimeString()}.`,
      metadata: { bookingId: booking.id, resourceId: booking.resourceId },
    })
    await createNotification({
      organizationId: dbUser.organizationId,
      recipientId: null,
      type: "booking_created_org",
      title: "New booking created",
      message: `${dbUser.name} created a booking.`,
      metadata: { bookingId: booking.id, resourceId: booking.resourceId, userId: dbUser.id },
    })
    return NextResponse.json(booking)
  } catch (error) {
    if (error instanceof Error && error.message === "BOOKING_CONFLICT") {
      return NextResponse.json(
        { error: "This resource is already booked for the selected time range." },
        { status: 409 },
      )
    }
    console.error("Error creating booking:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}
