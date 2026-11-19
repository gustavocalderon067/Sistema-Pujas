import { Router } from "express";
import { bid, create, detail, list } from "../controllers/auction.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const auctionRouter = Router();
auctionRouter.get("/", list);
auctionRouter.get("/:id", detail);
auctionRouter.post("/", requireAuth, create);
auctionRouter.post("/:id/bids", requireAuth, bid);
