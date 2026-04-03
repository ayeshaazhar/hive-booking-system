import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.resource.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await req.json();
    console.log('PATCH /api/resources/[id] updates:', updates);
    const updated = await prisma.resource.update({
      where: { id: params.id },
      data: updates,
    });
    console.log('PATCH /api/resources/[id] updated:', updated);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PATCH /api/resources/[id] error:', error);
    return NextResponse.json({ error: "Failed to update resource", details: error?.message || error }, { status: 400 });
  }
} 