import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// In dev, attach to global to survive hot-reloads without exhausting connections.
// In production (serverless), each function invocation gets its own instance.
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
