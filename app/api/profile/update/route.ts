import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { company, department, phone } = await req.json()
  try {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: session.user.email.trim(), mode: "insensitive" } },
    })
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        company,
        department,
        phone,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
} 