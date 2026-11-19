import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { corsOrigins } from "../config/env.js";
import { prisma } from "../config/prisma.js";

let io: Server;

export function initializeSocket(server: HttpServer) {
  io = new Server(server, { cors: { origin: corsOrigins, methods: ["GET", "POST"] } });
  io.on("connection", (socket) => {
    socket.on("auction:join", async (auctionId: unknown, acknowledge?: (result: { ok: boolean; error?: string }) => void) => {
      if (typeof auctionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(auctionId)) {
        acknowledge?.({ ok: false, error: "ID de subasta inválido" });
        return;
      }
      try {
        const exists = await prisma.auction.findUnique({ where: { id: auctionId }, select: { id: true } });
        if (!exists) { acknowledge?.({ ok: false, error: "Subasta no encontrada" }); return; }
        await socket.join(`auction:${auctionId}`);
        acknowledge?.({ ok: true });
      } catch {
        acknowledge?.({ ok: false, error: "No se pudo unir a la subasta" });
      }
    });
    socket.on("auction:leave", (auctionId: unknown) => {
      if (typeof auctionId === "string") void socket.leave(`auction:${auctionId}`);
    });
  });
  return io;
}

export function emitBidPlaced(auctionId: string, payload: unknown) {
  io?.to(`auction:${auctionId}`).emit("bid:placed", payload);
}

export function emitAuctionEnded(auctionId: string) {
  io?.to(`auction:${auctionId}`).emit("auction:ended", { auctionId });
}
