import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { endExpiredAuctions } from "./services/auction.service.js";
import { emitAuctionEnded, initializeSocket } from "./websocket/socket.js";

const server = createServer(app);
initializeSocket(server);

const sweepAuctions = async () => {
  try {
    const expired = await prisma.auction.findMany({ where: { status: "ACTIVE", endsAt: { lte: new Date() } }, select: { id: true } });
    await endExpiredAuctions();
    expired.forEach(({ id }) => emitAuctionEnded(id));
  } catch (error) { console.error("No se pudieron actualizar las subastas vencidas", error); }
};

server.listen(env.PORT, () => console.log(`API escuchando en http://localhost:${env.PORT}`));
void sweepAuctions();
setInterval(() => void sweepAuctions(), 15_000).unref();

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
