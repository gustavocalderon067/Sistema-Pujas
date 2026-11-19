import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { loginUser, registerUser } from "../services/auth.service.js";

const registerSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().transform((value) => value.toLowerCase()), password: z.string().min(8).max(72) });
const loginSchema = z.object({ email: z.string().trim().email().transform((value) => value.toLowerCase()), password: z.string().min(1).max(72) });

export async function register(req: Request, res: Response, next: NextFunction) {
  try { return res.status(201).json(await registerUser(registerSchema.parse(req.body))); } catch (error) { return next(error); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    return res.json(await loginUser(email, password));
  } catch (error) { return next(error); }
}

export function me(req: Request, res: Response) { return res.json({ user: req.user }); }
