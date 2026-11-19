import type { Request, Response, NextFunction } from "express";
import { AuctionStatus } from "../generated/prisma/client.js";
import { z } from "zod";
import { createAuction, getAuction, listAuctions, placeBid } from "../services/auction.service.js";
import { emitBidPlaced } from "../websocket/socket.js";

const idSchema = z.string().uuid();
const createSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().min(5).max(5000),
  imageUrl: z.string().url().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  startingPrice: z.number().positive().max(9999999999.99),
  minIncrement: z.number().positive().max(9999999999.99).default(1),
});
const bidSchema = z.object({ amount: z.number().positive().max(9999999999.99) });

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const rawStatus = req.query.status;
    const status = rawStatus ? z.nativeEnum(AuctionStatus).parse(rawStatus) : undefined;
    return res.json({ auctions: await listAuctions(status) });
  } catch (error) { return next(error); }
}

export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const auction = await getAuction(idSchema.parse(req.params.id));
    if (!auction) return res.status(404).json({ error: "Subasta no encontrada" });
    return res.json({ auction });
  } catch (error) { return next(error); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    return res.status(201).json({ auction: await createAuction(req.user!.id, createSchema.parse(req.body)) });
  } catch (error) { return next(error); }
}

export async function bid(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await placeBid(idSchema.parse(req.params.id), req.user!.id, bidSchema.parse(req.body).amount);
    emitBidPlaced(result.auction.id, { bid: result.bid, currentPrice: result.auction.currentPrice.toString(), endsAt: result.auction.endsAt });
    return res.status(201).json(result);
  } catch (error) { return next(error); }
}
