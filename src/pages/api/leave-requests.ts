import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const leaveRequests = await prisma.leaveRequest.findMany();
    res.status(200).json(leaveRequests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  } finally {
    await prisma.$disconnect();
  }
}
