import { prisma } from "@/lib/prisma"
import { isAdminEmail } from "@/lib/admin-auth"

/** True if allowlisted email or database role is admin (matches JWT `isAdmin`). */
export async function isUserAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  if (isAdminEmail(normalized)) return true
  const u = await prisma.user.findUnique({ where: { email: normalized } })
  return u?.role === "admin"
}
