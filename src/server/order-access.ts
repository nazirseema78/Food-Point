import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Lets a guest's browser view orders it placed (or unlocked with order number + phone)
// without logging in. Each entry is signed so it can't be forged by editing the cookie.

const COOKIE = "fp_orders";
const MAX_ENTRIES = 20;

function sign(orderNumber: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret).update(orderNumber).digest("base64url").slice(0, 22);
}

function verify(entry: string): string | null {
  const [orderNumber, sig] = entry.split(".");
  if (!orderNumber || !sig) return null;
  const expected = Buffer.from(sign(orderNumber));
  const actual = Buffer.from(sig);
  return expected.length === actual.length && timingSafeEqual(expected, actual) ? orderNumber : null;
}

export async function getAccessibleOrderNumbers(): Promise<string[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  return raw
    .split(",")
    .map(verify)
    .filter((n): n is string => !!n);
}

export async function grantOrderAccess(orderNumber: string): Promise<void> {
  const store = await cookies();
  const existing = await getAccessibleOrderNumbers();
  const numbers = [orderNumber, ...existing.filter((n) => n !== orderNumber)].slice(0, MAX_ENTRIES);
  store.set(COOKIE, numbers.map((n) => `${n}.${sign(n)}`).join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** e.g. FP261019-K7Q2 — date in IST + 4 random chars. */
export function generateOrderNumber(now: Date = new Date()): string {
  const ist = new Date(now.getTime() + 330 * 60 * 1000);
  const date = ist.toISOString().slice(2, 10).replace(/-/g, "");
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `FP${date}-${suffix}`;
}
