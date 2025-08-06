import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    try {
      const category = await prisma.category.create({ data: { name } });
      return res.status(201).json(category);
    } catch (error) {
      return res.status(500).json({ error: 'Category already exists or server error' });
    }
  }

  if (req.method === 'GET') {
    const categories = await prisma.category.findMany();
    return res.status(200).json(categories);
  }

  res.status(405).end();
}
