import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "@/lib/prisma"
import { getUserWithOrganizationByEmail } from "@/lib/organization"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const user = await getUserWithOrganizationByEmail(session.user.email)
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const amenities = await prisma.amenity.findMany({
    where: { organizationId: user.organizationId ?? undefined },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(amenities)
}
