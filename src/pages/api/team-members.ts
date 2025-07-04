import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const teamMembers = await prisma.teamMember.findMany();
    res.status(200).json(teamMembers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team members' });
  } finally {
    await prisma.$disconnect();
  }
}
