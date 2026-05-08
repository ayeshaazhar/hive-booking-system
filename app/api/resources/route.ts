// app/api/resources/route.ts
import { NextResponse, NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "@/lib/prisma"
import { isUserAdmin } from "@/lib/admin-server"
import { getUserWithOrganizationByEmail } from "@/lib/organization"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const RESOURCE_TYPES = new Set(["meeting_room", "phone_booth", "equipment"])

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const user = await getUserWithOrganizationByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const resources = await prisma.resource.findMany({
      where: {
        OR: [
          { organizationId: user.organizationId ?? undefined },
          { organizationId: null }, // Backward compatibility for legacy unscoped resources
        ],
      },
      orderBy: { name: "asc" },
      include: { amenities: { include: { amenity: true } } },
    })
    const normalized = resources.map((r) => ({
      ...r,
      amenities: r.amenities.map((a) => a.amenity.name),
    }))
    return NextResponse.json(normalized)
  } catch (error) {
    console.error("GET /api/resources", error)
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !(await isUserAdmin(session.user.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const actor = await getUserWithOrganizationByEmail(session.user.email)
  if (!actor) {
    return NextResponse.json({ error: "Admin user not found." }, { status: 404 })
  }

  try {
    const data = await req.json()
    const name = typeof data.name === "string" ? data.name.trim() : ""
    const type = typeof data.type === "string" ? data.type.trim() : ""
    const location = typeof data.location === "string" ? data.location.trim() : ""
    const capacity = Number(data.capacity)
    const status =
      typeof data.status === "string" && data.status.trim() ? data.status.trim() : "available"
    const description =
      typeof data.description === "string" && data.description.trim()
        ? data.description.trim()
        : undefined
    const amenities = Array.isArray(data.amenities)
      ? data.amenities.filter((a): a is string => typeof a === "string").map((a) => a.trim()).filter(Boolean)
      : []

    if (!name || !type || !location) {
      return NextResponse.json(
        { error: "Name, type, and location are required." },
        { status: 400 },
      )
    }
    if (!RESOURCE_TYPES.has(type)) {
      return NextResponse.json(
        { error: "Invalid type. Use meeting_room, phone_booth, or equipment." },
        { status: 400 },
      )
    }
    if (!Number.isFinite(capacity) || capacity < 1 || capacity > 500) {
      return NextResponse.json(
        { error: "Capacity must be a number between 1 and 500." },
        { status: 400 },
      )
    }

    const resource = await prisma.$transaction(async (tx) => {
      const created = await tx.resource.create({
        data: {
          name,
          type,
          location,
          capacity: Math.floor(capacity),
          status,
          description,
          organizationId: actor.organizationId,
        },
      })

      for (const amenityName of amenities) {
        const amenity = await tx.amenity.upsert({
          where: {
            name_organizationId: {
              name: amenityName,
              organizationId: actor.organizationId,
            },
          },
          create: {
            name: amenityName,
            organizationId: actor.organizationId,
          },
          update: {},
        })

        await tx.resourceAmenity.upsert({
          where: {
            resourceId_amenityId: { resourceId: created.id, amenityId: amenity.id },
          },
          create: { resourceId: created.id, amenityId: amenity.id },
          update: {},
        })
      }

      return tx.resource.findUnique({
        where: { id: created.id },
        include: { amenities: { include: { amenity: true } } },
      })
    })

    if (!resource) {
      return NextResponse.json({ error: "Failed to load created resource" }, { status: 500 })
    }
    return NextResponse.json(
      { ...resource, amenities: resource.amenities.map((a) => a.amenity.name) },
      { status: 201 },
    )
  } catch (error) {
    console.error("POST /api/resources", error)
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 })
  }
}
