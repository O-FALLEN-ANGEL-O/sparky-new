import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const announcements = await prisma.hrAnnouncement.findMany();
    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch HR announcements' });
  } finally {
    await prisma.$disconnect();
  }
}
