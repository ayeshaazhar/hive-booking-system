import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { prisma } from "@/lib/prisma"
import { isUserAdmin } from "@/lib/admin-server"
import { getUserWithOrganizationByEmail } from "@/lib/organization"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const RESOURCE_TYPES = new Set(["meeting_room", "phone_booth", "equipment"])

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !(await isUserAdmin(session.user.email))) return null
  return session
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const actor = await getUserWithOrganizationByEmail(session.user.email!)
  if (!actor) {
    return NextResponse.json({ error: "Admin user not found." }, { status: 404 })
  }

  try {
    const count = await prisma.booking.count({
      where: { resourceId: params.id, organizationId: actor.organizationId ?? undefined },
    })
    if (count > 0) {
      return NextResponse.json(
        {
          error: `This resource has ${count} booking(s). Cancel or reassign them before deleting.`,
        },
        { status: 409 },
      )
    }
    await prisma.resource.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/resources/[id]", error)
    return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const actor = await getUserWithOrganizationByEmail(session.user.email!)
  if (!actor) {
    return NextResponse.json({ error: "Admin user not found." }, { status: 404 })
  }

  try {
    const body = await req.json()
    const data: {
      name?: string
      type?: string
      location?: string
      capacity?: number
      status?: string
      description?: string | null
    } = {}

    if (typeof body.name === "string") {
      const v = body.name.trim()
      if (!v) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
      data.name = v
    }
    if (typeof body.type === "string") {
      const v = body.type.trim()
      if (!RESOURCE_TYPES.has(v)) {
        return NextResponse.json({ error: "Invalid resource type" }, { status: 400 })
      }
      data.type = v
    }
    if (typeof body.location === "string") {
      const v = body.location.trim()
      if (!v) return NextResponse.json({ error: "Location cannot be empty" }, { status: 400 })
      data.location = v
    }
    if (body.capacity !== undefined) {
      const n = Number(body.capacity)
      if (!Number.isFinite(n) || n < 1 || n > 500) {
        return NextResponse.json({ error: "Capacity must be between 1 and 500" }, { status: 400 })
      }
      data.capacity = Math.floor(n)
    }
    if (typeof body.status === "string" && body.status.trim()) {
      data.status = body.status.trim()
    }
    if (typeof body.description === "string") {
      data.description = body.description.trim() || null
    }
    if (body.description === null) data.description = null
    const amenities = Array.isArray(body.amenities)
      ? body.amenities.filter((a): a is string => typeof a === "string").map((a) => a.trim()).filter(Boolean)
      : null

    if (Object.keys(data).length === 0 && amenities === null) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.resource.update({
        where: { id: params.id },
        data,
      })

      if (amenities) {
        await tx.resourceAmenity.deleteMany({ where: { resourceId: params.id } })
        for (const amenityName of amenities) {
          const amenity = await tx.amenity.upsert({
            where: {
              name_organizationId: {
                name: amenityName,
                organizationId: actor.organizationId,
              },
            },
            create: { name: amenityName, organizationId: actor.organizationId },
            update: {},
          })
          await tx.resourceAmenity.create({
            data: { resourceId: params.id, amenityId: amenity.id },
          })
        }
      }

      return tx.resource.findUnique({
        where: { id: params.id },
        include: { amenities: { include: { amenity: true } } },
      })
    })
    if (!updated) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }
    return NextResponse.json({ ...updated, amenities: updated.amenities.map((a) => a.amenity.name) })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("PATCH /api/resources/[id]", error)
    return NextResponse.json({ error: "Failed to update resource", details: msg }, { status: 400 })
  }
}
