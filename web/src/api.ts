export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export type Auction = {
  id: string;
  startsAt: string;
  endsAt: string;
  startingPrice: string;
  currentPrice: string;
  minIncrement: string;
  status: "SCHEDULED" | "ACTIVE" | "ENDED" | "CANCELLED";
  product: { id: string; name: string; description: string; imageUrl: string | null; seller: { id: string; name: string } };
  _count?: { bids: number };
  bids?: { id: string; amount: string; createdAt: string; bidder: { id: string; name: string } }[];
};

export type Session = { token: string; user: { id: string; name: string; email: string; role: string } };

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("pujas-token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "No se pudo completar la solicitud");
  return body as T;
}

export function money(value: string | number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(value));
}
