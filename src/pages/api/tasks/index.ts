import type { NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { createTaskSchema } from "@/schemas";
import { ZodError } from "zod";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const { categoryId, status } = req.query;

    try {
      const tasks = await prisma.task.findMany({
        where: {
          userId,
          ...(categoryId && !isNaN(Number(categoryId)) && { categoryId: Number(categoryId) }),
          ...(status && typeof status === "string" && { status: status.toUpperCase() }),
        },
      });
      return res.status(200).json(tasks);
    } catch {
      return res.status(500).json({ error: "Failed to fetch tasks" });
    }
  }

  if (req.method === "POST") {
    try {
      const data = createTaskSchema.parse(req.body);
      const { title, description, categoryId } = data;

      if (categoryId) {
        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!category) return res.status(404).json({ error: "Category not found" });
      }

      const newTask = await prisma.task.create({
        data: { title, description, categoryId, userId },
      });

      return res.status(201).json(newTask);
    } catch (error) {
     if (error instanceof ZodError) {
  return res.status(400).json({ errors: error.issues });
}

      return res.status(500).json({ error: "Failed to create task" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withAuth(handler);
