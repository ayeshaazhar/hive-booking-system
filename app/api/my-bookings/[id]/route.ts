import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"
import type { Session } from "next-auth"

async function resolveDbUserId(session: Session | null): Promise<string | null> {
  const email = session?.user?.email
  if (!email) return null
  const u = await prisma.user.findUnique({ where: { email } })
  return u?.id ?? null
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const userId = await resolveDbUserId(session)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { resource: true },
  })
  if (!booking || booking.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(booking)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const userId = await resolveDbUserId(session)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let data: Record<string, unknown>
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({ where: { id: params.id } })
  if (!booking || booking.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const nextStart =
    typeof data.startTime === "string" ? new Date(data.startTime) : booking.startTime
  const nextEnd = typeof data.endTime === "string" ? new Date(data.endTime) : booking.endTime
  if (typeof data.startTime === "string" && Number.isNaN(nextStart.getTime())) {
    return NextResponse.json({ error: "Invalid startTime" }, { status: 400 })
  }
  if (typeof data.endTime === "string" && Number.isNaN(nextEnd.getTime())) {
    return NextResponse.json({ error: "Invalid endTime" }, { status: 400 })
  }
  if (nextEnd <= nextStart) {
    return NextResponse.json({ error: "endTime must be after startTime" }, { status: 400 })
  }

  const timesChange = typeof data.startTime === "string" || typeof data.endTime === "string"
  if (timesChange) {
    const overlapping = await prisma.booking.findFirst({
      where: {
        id: { not: params.id },
        resourceId: booking.resourceId,
        status: { in: ["confirmed", "pending"] },
        startTime: { lt: nextEnd },
        endTime: { gt: nextStart },
      },
    })
    if (overlapping) {
      return NextResponse.json(
        { error: "This resource is already booked for the selected time range." },
        { status: 409 },
      )
    }
  }

  const allowed: {
    status?: string
    purpose?: string | null
    notes?: string | null
    startTime?: Date
    endTime?: Date
  } = {}
  if (typeof data.status === "string") allowed.status = data.status
  if (typeof data.purpose === "string") allowed.purpose = data.purpose
  if (data.purpose === null) allowed.purpose = null
  if (typeof data.notes === "string") allowed.notes = data.notes
  if (data.notes === null) allowed.notes = null
  if (typeof data.startTime === "string") allowed.startTime = nextStart
  if (typeof data.endTime === "string") allowed.endTime = nextEnd

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: allowed,
    include: { resource: true },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const userId = await resolveDbUserId(session)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const booking = await prisma.booking.findUnique({ where: { id: params.id } })
  if (!booking || booking.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  await prisma.booking.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
