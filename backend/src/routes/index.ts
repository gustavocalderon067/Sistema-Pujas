import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { auctionRouter } from "./auction.routes.js";

export const apiRouter = Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/auctions", auctionRouter);
