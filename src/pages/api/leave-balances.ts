import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const leaveBalances = await prisma.leaveBalance.findMany();
    res.status(200).json(leaveBalances);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leave balances' });
  } finally {
    await prisma.$disconnect();
  }
}
