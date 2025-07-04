import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const documents = await prisma.hrDocument.findMany();
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch HR documents' });
  } finally {
    await prisma.$disconnect();
  }
}
