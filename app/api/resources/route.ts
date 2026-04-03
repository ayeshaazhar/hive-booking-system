// app/api/resources/route.ts
import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const resources = await prisma.resource.findMany()
    return NextResponse.json(resources)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { name, type, location, capacity, status = "available" } = data;
    if (!name || !type || !location || typeof capacity !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const resource = await prisma.resource.create({
      data: { name, type, location, capacity, status },
    });
    return NextResponse.json(resource);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}
