import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userRoles = await prisma.userRole.findMany();
    res.status(200).json(userRoles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user roles' });
  } finally {
    await prisma.$disconnect();
  }
}
