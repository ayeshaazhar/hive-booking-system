import { prisma } from "@/lib/prisma"

type Snapshot = Record<string, unknown>

export async function createBookingAuditLog(input: {
  bookingId: string
  action: string
  actorUserId?: string | null
  snapshot?: Snapshot
}) {
  await prisma.bookingAuditLog.create({
    data: {
      bookingId: input.bookingId,
      action: input.action,
      actorUserId: input.actorUserId ?? null,
      snapshot: input.snapshot ?? undefined,
    },
  })
}

export async function createNotification(input: {
  organizationId?: string | null
  recipientId?: string | null
  type: string
  title: string
  message: string
  metadata?: Snapshot
}) {
  await prisma.notification.create({
    data: {
      organizationId: input.organizationId ?? null,
      recipientId: input.recipientId ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata ?? undefined,
    },
  })
}
