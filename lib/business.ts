import { prisma } from '@/lib/prisma';

// Single-tenant deployment: BUSINESS_SLUG pins the dashboard to one clinic.
// Falls back to the oldest seeded business when unset, so local/dev setups
// with only one row in the table keep working without extra config.
export function getCurrentBusiness() {
  const slug = process.env.BUSINESS_SLUG;
  if (slug) return prisma.business.findUnique({ where: { slug } });
  return prisma.business.findFirst({ orderBy: { createdAt: 'asc' } });
}
