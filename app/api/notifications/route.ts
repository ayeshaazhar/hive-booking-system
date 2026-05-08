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

  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        { recipientId: user.id },
        { recipientId: null, organizationId: user.organizationId ?? undefined },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  const filtered = notifications.filter((notification) => {
    if (notification.type !== "booking_created_org") return true
    const metadata = notification.metadata as Record<string, unknown> | null
    return metadata?.userId !== user.id
  })
  return NextResponse.json(filtered)
}
