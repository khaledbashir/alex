import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export function getPrisma(): PrismaClient {
  if (!globalThis.prisma) {
    // Build-time safety: If DATABASE_URL is missing, don't crash here.
    // PrismaClient will only truly fail when a query is executed.
    // However, some versions check the URL during construction.
    try {
      globalThis.prisma = new PrismaClient();
    } catch (err) {
      console.error('Failed to initialize PrismaClient:', err);
      // Return a proxy or just re-throw, but at least we caught it
      throw err;
    }
  }
  return globalThis.prisma;
}
