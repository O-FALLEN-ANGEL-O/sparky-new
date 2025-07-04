import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const alerts = await prisma.securityAlert.findMany();
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch security alerts' });
  } finally {
    await prisma.$disconnect();
  }
}
