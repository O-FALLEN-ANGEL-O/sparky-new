import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const teamTasks = await prisma.teamTask.findMany();
    res.status(200).json(teamTasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team tasks' });
  } finally {
    await prisma.$disconnect();
  }
}
