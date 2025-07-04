import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const payrollData = await prisma.payroll.findMany();
    res.status(200).json(payrollData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payroll data' });
  } finally {
    await prisma.$disconnect();
  }
}
