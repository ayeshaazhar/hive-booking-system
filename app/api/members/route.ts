// // app/api/members/route.ts
// import { prisma } from '@/lib/prisma'
// import { NextResponse } from 'next/server'

// export async function GET() {
//   const members = await prisma.user.findMany()
//   return NextResponse.json(members)
// }
// app/api/members/route.ts
// app/api/members/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.json()
  const {
    name,
    email,
    company = "",
    department = "",
    phone = "",
    role = "member",
    status = "active"
  } = body

  try {
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        company,
        department,
        phone,
        // role and status are not in the schema, but we can return them in the response for UI consistency
      },
    })
    // Return the full member object for UI
    return NextResponse.json({ ...newUser, role, status }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const users = await prisma.user.findMany()
    // Add default role/status for UI
    const members = users.map(u => ({ ...u, role: "member", status: "active" }))
    return NextResponse.json(members)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
