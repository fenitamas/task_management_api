import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { registerSchema } from "@/schemas";
import { ZodError } from "zod";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { username, email, password } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email or username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword },
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    if (error instanceof ZodError) {
  return res.status(400).json({ errors: error.issues });
}

    return res.status(500).json({ error: "Internal Server Error" });
  }
}
