import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { resource: true },
  })
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(booking)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const data = await req.json()
  // Only allow update if booking belongs to user
  const booking = await prisma.booking.findUnique({ where: { id: params.id } })
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const updated = await prisma.booking.update({ where: { id: params.id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const booking = await prisma.booking.findUnique({ where: { id: params.id } })
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  await prisma.booking.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
} 