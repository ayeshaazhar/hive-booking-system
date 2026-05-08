import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "@/lib/prisma"
import { isUserAdmin } from "@/lib/admin-server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !(await isUserAdmin(session.user.email))) return null
  return session
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = params.id
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const data: {
    name?: string
    email?: string
    company?: string | null
    department?: string | null
    phone?: string | null
    role?: string
    isActive?: boolean
  } = {}

  if (typeof body.name === "string") {
    const v = body.name.trim()
    if (!v) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
    data.name = v
  }
  if (typeof body.email === "string") {
    const v = body.email.trim().toLowerCase()
    if (!v) return NextResponse.json({ error: "Email cannot be empty" }, { status: 400 })
    data.email = v
  }
  if (typeof body.company === "string") data.company = body.company.trim() || null
  if (typeof body.department === "string") data.department = body.department.trim() || null
  if (typeof body.phone === "string") data.phone = body.phone.trim() || null
  if (body.role === "admin" || body.role === "member") data.role = body.role
  if (typeof body.status === "string") {
    if (body.status === "active") data.isActive = true
    else if (body.status === "inactive" || body.status === "pending") data.isActive = false
  }
  if (typeof body.isActive === "boolean") data.isActive = body.isActive

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data,
      include: { _count: { select: { bookings: true } } },
    })

    const status = updated.isActive ? "active" : "inactive"
    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      company: updated.company ?? "",
      department: updated.department ?? "",
      phone: updated.phone ?? "",
      role: updated.role === "admin" ? "admin" : "member",
      status,
      joinDate: "",
      totalBookings: updated._count.bookings,
    })
  } catch (error: unknown) {
    console.error("PATCH /api/members/[id]", error)
    const code = error && typeof error === "object" && "code" in error ? (error as { code: string }).code : ""
    if (code === "P2002") {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = params.id

  try {
    const count = await prisma.booking.count({ where: { userId: id } })
    if (count > 0) {
      return NextResponse.json(
        {
          error: `This user has ${count} booking(s). Deactivate the account instead of deleting.`,
        },
        { status: 409 },
      )
    }
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ message: "Deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/members/[id]", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
