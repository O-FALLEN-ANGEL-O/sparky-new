import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const deliveryAgents = await prisma.deliveryAgent.findMany();
    res.status(200).json(deliveryAgents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch delivery agents' });
  } finally {
    await prisma.$disconnect();
  }
}
