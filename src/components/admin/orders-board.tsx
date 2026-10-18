"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, Bike, ShoppingBag } from "lucide-react";
import type { BoardOrder } from "@/server/queries/orders";
import { formatINR } from "@/lib/money";
import { isFinal } from "@/lib/order-status";
import { cn, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/order/status-badge";
import { addonNames } from "@/components/order/order-lines";
import { StatusActions } from "./status-actions";

const POLL_MS = 10_000;
const SOUND_KEY = "fp-admin-sound";

// Serialised over JSON, so dates arrive as strings.
type Order = Omit<BoardOrder, "createdAt"> & { createdAt: string };

/** Short two-tone chime via Web Audio; no audio file needed. */
function playChime(ctx: AudioContext) {
  const now = ctx.currentTime;
  [880, 1320, 880, 1320].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = now + i * 0.22;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.21);
  });
}

type Tab = "active" | "done" | "cancelled";

export function OrdersBoard({ initial }: { initial: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initial);
  const [tab, setTab] = useState<Tab>("active");
  const [soundOn, setSoundOn] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [offline, setOffline] = useState(false);
  const seen = useRef(new Set(initial.map((o) => o.id)));
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(SOUND_KEY) === "on") setSoundOn(true);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data: { orders: Order[] } = await res.json();
      const fresh = data.orders.filter((o) => !seen.current.has(o.id));
      fresh.forEach((o) => seen.current.add(o.id));
      if (fresh.length > 0) {
        if (audio.current && soundOn) playChime(audio.current);
        document.title = `(${fresh.length}) New order! · Admin`;
        setTab("active");
      }
      setOrders(data.orders);
      setLastSync(new Date());
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, [soundOn]);

  useEffect(() => {
    const id = setInterval(refresh, POLL_MS);
    const onFocus = () => {
      document.title = "Orders · Admin";
      refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  function toggleSound() {
    // Browsers only allow audio after a user gesture, hence the explicit button.
    if (!soundOn) {
      audio.current ??= new AudioContext();
      void audio.current.resume();
      playChime(audio.current);
    }
    const next = !soundOn;
    setSoundOn(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    } catch {
      /* storage unavailable */
    }
  }

  // Restored "on" preference still needs a gesture to unlock audio.
  useEffect(() => {
    if (!soundOn || audio.current) return;
    const unlock = () => {
      audio.current ??= new AudioContext();
      void audio.current.resume();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [soundOn]);

  const groups: Record<Tab, Order[]> = {
    active: orders.filter((o) => !isFinal(o.status)).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    done: orders.filter((o) => o.status === "DELIVERED" || o.status === "COMPLETED"),
    cancelled: orders.filter((o) => o.status === "CANCELLED"),
  };
  const shown = groups[tab];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-stone-300 bg-white p-0.5 text-sm" role="tablist">
          {(
            [
              ["active", "Active"],
              ["done", "Completed today"],
              ["cancelled", "Cancelled"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn("rounded-lg px-3 py-1.5 font-medium", tab === key ? "bg-stone-900 text-white" : "text-stone-600")}
            >
              {label} <span className="opacity-70">({groups[key].length})</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-stone-500">
          <span className={cn(offline && "font-medium text-red-600")}>
            {offline ? "Connection lost — retrying" : lastSync ? `Updated ${formatTime(lastSync)}` : "Live"}
          </span>
          <Button variant={soundOn ? "secondary" : "outline"} size="sm" onClick={toggleSound}>
            {soundOn ? <Bell /> : <BellOff />} Sound {soundOn ? "on" : "off"}
          </Button>
        </div>
      </div>

      {!soundOn && (
        <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Turn on <strong>Sound</strong> to hear a chime when a new order arrives. Keep this tab open.
        </p>
      )}

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
          {tab === "active" ? "No active orders. New orders will appear here automatically." : "Nothing here yet today."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((o) => {
            const minutes = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000);
            return (
              <article
                key={o.id}
                className={cn(
                  "flex flex-col rounded-2xl border bg-white p-4 shadow-sm",
                  o.status === "PENDING" ? "border-amber-400 ring-2 ring-amber-100" : "border-stone-200",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/admin/orders/${o.id}`} className="font-bold hover:underline">
                      {o.orderNumber}
                    </Link>
                    <p className="text-xs text-stone-500">
                      {formatTime(o.createdAt)} · {minutes < 1 ? "just now" : `${minutes} min ago`}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>

                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium">
                  {o.type === "DELIVERY" ? <Bike className="size-4" /> : <ShoppingBag className="size-4" />}
                  {o.type === "DELIVERY" ? "Delivery" : "Takeaway"} · {o.customerName}
                  {o.area && <span className="font-normal text-stone-500">· {o.area}</span>}
                </p>

                <ul className="mt-2 space-y-0.5 text-sm text-stone-700">
                  {o.items.map((item, i) => {
                    const extras = [item.variantName, ...addonNames(item.addons)].filter(Boolean);
                    return (
                      <li key={i}>
                        <span className="font-semibold">{item.quantity}×</span> {item.productName}
                        {extras.length > 0 && <span className="text-xs text-stone-500"> ({extras.join(", ")})</span>}
                      </li>
                    );
                  })}
                </ul>
                {o.notes && <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-900">Note: {o.notes}</p>}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                  <span className="font-bold">{formatINR(o.total)}</span>
                  <StatusActions orderId={o.id} type={o.type} status={o.status} onChanged={refresh} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
