// app/api/bookings/route.ts — admin-only list of all bookings
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "@/lib/prisma"
import { isUserAdmin } from "@/lib/admin-server"
import { getUserWithOrganizationByEmail } from "@/lib/organization"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !(await isUserAdmin(session.user.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const actor = await getUserWithOrganizationByEmail(session.user.email)
  if (!actor) {
    return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { organizationId: actor.organizationId ?? undefined },
      include: {
        user: true,
        resource: true,
      },
      orderBy: { startTime: "desc" },
    })
    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}
