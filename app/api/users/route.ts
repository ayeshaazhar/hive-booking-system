// app/api/users/route.ts (for App Router)
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/** Avoid running Prisma during `next build` static analysis / export (breaks on Vercel without a live DB). */
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        department: true,
        phone: true,
      },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error("[api/users] GET failed:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
