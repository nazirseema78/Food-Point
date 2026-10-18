import "server-only";

// Notification hook points. Phase 1: the admin board polls for new orders, so these
// are no-ops. Phase 2 plugs SMS / WhatsApp / email in here without touching callers.

export type OrderNotice = { orderNumber: string; customerPhone: string; total: number };

export async function notifyNewOrder(_order: OrderNotice): Promise<void> {}

export async function notifyStatusChange(_order: OrderNotice & { status: string }): Promise<void> {}
