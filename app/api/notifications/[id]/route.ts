import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "@/lib/prisma"
import { getUserWithOrganizationByEmail } from "@/lib/organization"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const user = await getUserWithOrganizationByEmail(session.user.email)
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const notification = await prisma.notification.findUnique({ where: { id: params.id } })
  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 })
  }

  const belongsToUser =
    notification.recipientId === user.id ||
    (notification.recipientId === null && notification.organizationId === user.organizationId)

  if (!belongsToUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updated = await prisma.notification.update({
    where: { id: params.id },
    data: { isRead: true },
  })
  return NextResponse.json(updated)
}
