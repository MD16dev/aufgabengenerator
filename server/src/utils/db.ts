import { PrismaClient } from '@prisma/client';

// Single shared Prisma Client instance
export const prisma = new PrismaClient();

export default prisma;
