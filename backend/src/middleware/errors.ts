import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export const notFound: RequestHandler = (_req, res) => res.status(404).json({ error: "Recurso no encontrado" });

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Datos inválidos", details: error.issues.map(({ path, message }) => ({ path: path.join("."), message })) });
    return;
  }
  if (typeof error?.status === "number") {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Error interno del servidor" });
};
