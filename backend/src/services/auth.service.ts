import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";

export async function registerUser(input: { name: string; email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw Object.assign(new Error("Ese correo ya está registrado"), { status: 409 });
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({ data: { name: input.name, email: input.email, passwordHash }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
  return { user, token: jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }) };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw Object.assign(new Error("Correo o contraseña incorrectos"), { status: 401 });
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return { user: safeUser, token: jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }) };
}
