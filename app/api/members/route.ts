import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "@/lib/prisma"
import { isUserAdmin } from "@/lib/admin-server"
import { getUserWithOrganizationByEmail } from "@/lib/organization"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function toMemberRow(u: {
  id: string
  name: string
  email: string
  company: string | null
  department: string | null
  phone: string | null
  role: string
  isActive: boolean
  _count?: { bookings: number }
}) {
  const status = u.isActive ? "active" : "inactive"
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    company: u.company ?? "",
    department: u.department ?? "",
    phone: u.phone ?? "",
    role: u.role === "admin" ? "admin" : "member",
    status,
    joinDate: "",
    totalBookings: u._count?.bookings ?? 0,
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !(await isUserAdmin(session.user.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const actor = await getUserWithOrganizationByEmail(session.user.email)
  if (!actor) {
    return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
  }

  try {
    const body = await req.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const company = typeof body.company === "string" ? body.company.trim() : ""
    const department = typeof body.department === "string" ? body.department.trim() : ""
    const phone = typeof body.phone === "string" ? body.phone.trim() : ""
    const role = body.role === "admin" ? "admin" : "member"
    const status = typeof body.status === "string" ? body.status : "active"
    const isActive = status === "active"

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 })
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        company: company || null,
        department: department || null,
        phone: phone || null,
        role,
        isActive,
        organizationId: actor.organizationId,
      },
      include: { _count: { select: { bookings: true } } },
    })

    return NextResponse.json(toMemberRow(newUser), { status: 201 })
  } catch (error: unknown) {
    console.error("POST /api/members", error)
    const code = error && typeof error === "object" && "code" in error ? (error as { code: string }).code : ""
    if (code === "P2002") {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const user = await getUserWithOrganizationByEmail(session.user.email)
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  try {
    const users = await prisma.user.findMany({
      where: { organizationId: user.organizationId ?? undefined },
      include: { _count: { select: { bookings: true } } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(users.map(toMemberRow))
  } catch (error) {
    console.error("GET /api/members", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}
