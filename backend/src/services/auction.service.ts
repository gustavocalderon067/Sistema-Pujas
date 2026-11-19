import { AuctionStatus, Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";

const auctionInclude = { product: { select: { id: true, name: true, description: true, imageUrl: true, seller: { select: { id: true, name: true } } } }, _count: { select: { bids: true } } } as const;

export async function listAuctions(status?: AuctionStatus) {
  const where = status ? { status } : {};
  return prisma.auction.findMany({ where, include: auctionInclude, orderBy: [{ endsAt: "asc" }] });
}

export async function getAuction(id: string) {
  return prisma.auction.findUnique({ where: { id }, include: { ...auctionInclude, bids: { take: 20, orderBy: { createdAt: "desc" }, include: { bidder: { select: { id: true, name: true } } } } } });
}

export async function createAuction(sellerId: string, input: { name: string; description: string; imageUrl?: string; startsAt: Date; endsAt: Date; startingPrice: number; minIncrement: number }) {
  const startsAt = input.startsAt;
  const endsAt = input.endsAt;
  if (endsAt <= startsAt || endsAt <= new Date()) throw Object.assign(new Error("La fecha de cierre debe ser futura y posterior al inicio"), { status: 400 });
  const status = startsAt <= new Date() ? AuctionStatus.ACTIVE : AuctionStatus.SCHEDULED;
  return prisma.auction.create({
    data: {
      startsAt, endsAt, startingPrice: input.startingPrice, currentPrice: input.startingPrice, minIncrement: input.minIncrement, status,
      product: { create: { name: input.name, description: input.description, imageUrl: input.imageUrl, sellerId } },
    }, include: auctionInclude,
  });
}

export async function placeBid(auctionId: string, bidderId: string, amount: number) {
  return prisma.$transaction(async (tx) => {
    // Serialize bids on a single auction row so concurrent bidders see the newest price.
    await tx.$queryRaw`SELECT id FROM "Auction" WHERE id = ${auctionId}::uuid FOR UPDATE`;
    const auction = await tx.auction.findUnique({ where: { id: auctionId }, include: { product: { select: { sellerId: true } } } });
    if (!auction) throw Object.assign(new Error("Subasta no encontrada"), { status: 404 });
    const now = new Date();
    if (auction.status !== AuctionStatus.ACTIVE || auction.startsAt > now || auction.endsAt <= now) throw Object.assign(new Error("La subasta no está activa"), { status: 409 });
    if (auction.product.sellerId === bidderId) throw Object.assign(new Error("No puedes ofertar en tu propia subasta"), { status: 403 });
    const bidAmount = new Prisma.Decimal(amount);
    const minAllowed = auction.currentPrice.add(auction.minIncrement);
    if (bidAmount.lessThan(minAllowed)) throw Object.assign(new Error(`La oferta mínima es ${minAllowed.toFixed(2)}`), { status: 400 });
    const bid = await tx.bid.create({ data: { auctionId, bidderId, amount: bidAmount }, include: { bidder: { select: { id: true, name: true } } } });
    const updatedAuction = await tx.auction.update({ where: { id: auctionId }, data: { currentPrice: bidAmount } });
    return { bid, auction: updatedAuction };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
}

export async function endExpiredAuctions() {
  const now = new Date();
  await prisma.auction.updateMany({ where: { status: { in: [AuctionStatus.ACTIVE, AuctionStatus.SCHEDULED] }, endsAt: { lte: now } }, data: { status: AuctionStatus.ENDED } });
  await prisma.auction.updateMany({ where: { status: AuctionStatus.SCHEDULED, startsAt: { lte: now }, endsAt: { gt: now } }, data: { status: AuctionStatus.ACTIVE } });
}
