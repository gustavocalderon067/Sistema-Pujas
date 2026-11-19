import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { corsOrigins } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errors.js";

export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);
