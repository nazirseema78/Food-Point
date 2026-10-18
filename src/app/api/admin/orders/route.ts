import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth-guard";
import { getBoardOrders } from "@/server/queries/orders";

export const dynamic = "force-dynamic";

// Polled by the admin orders board.
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orders = await getBoardOrders();
  return NextResponse.json({ orders }, { headers: { "Cache-Control": "no-store" } });
}
