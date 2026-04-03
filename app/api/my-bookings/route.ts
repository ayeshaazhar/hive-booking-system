// app/api/my-bookings/route.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    return NextResponse.json([], { status: 401 })
  }

  try {
    const userWithBookings = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        bookings: {
          select: {
            id: true,
            userId: true,
            resourceId: true,
            startTime: true,
            endTime: true,
            status: true,
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
  let data;
  try {
    data = await req.json()
    // Remove memberId and userId if present
    if ('memberId' in data) delete data.memberId;
    if ('userId' in data) delete data.userId;
    // Look up the user in the database
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const booking = await prisma.booking.create({
      data: {
        ...data,
        userId: dbUser.id,
      },
    })
    return NextResponse.json(booking)
  } catch (error) {
    console.error("Error creating booking:", error, "Data:", data)
    return NextResponse.json({ error: String(error), data }, { status: 500 })
  }
}
