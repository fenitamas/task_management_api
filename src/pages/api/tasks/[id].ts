import type { NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { updateTaskSchema } from "@/schemas";
import { ZodError } from "zod";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userId = req.userId;
  const taskId = parseInt(req.query.id as string);

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (isNaN(taskId)) return res.status(400).json({ error: "Invalid task ID" });

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.userId !== userId) {
    return res.status(404).json({ error: "Task not found or access denied" });
  }

  if (req.method === "PUT") {
    try {
      const data = updateTaskSchema.parse(req.body);

      const updated = await prisma.task.update({
        where: { id: taskId },
        data,
      });

      return res.status(200).json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
  return res.status(400).json({ errors: error.issues });
}

      return res.status(500).json({ error: "Failed to update task" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.task.delete({ where: { id: taskId } });
      return res.status(204).end();
    } catch {
      return res.status(500).json({ error: "Failed to delete task" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withAuth(handler);
