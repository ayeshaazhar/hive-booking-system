import { prisma } from "@/lib/prisma"

const DEFAULT_ORG_SLUG = "default-workspace"
const DEFAULT_ORG_NAME = "Default Workspace"

export async function getOrCreateDefaultOrganization() {
  const existing = await prisma.organization.findUnique({
    where: { slug: DEFAULT_ORG_SLUG },
  })
  if (existing) return existing
  return prisma.organization.create({
    data: { slug: DEFAULT_ORG_SLUG, name: DEFAULT_ORG_NAME },
  })
}

export async function getUserWithOrganizationByEmail(email: string) {
  const normalized = email.trim().toLowerCase()
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    include: { organization: true },
  })
  if (!user) return null

  if (user.organizationId) return user

  const org = await getOrCreateDefaultOrganization()
  return prisma.user.update({
    where: { id: user.id },
    data: { organizationId: org.id },
    include: { organization: true },
  })
}
