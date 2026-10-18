import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";
import type { Branch } from "@/server/queries/branch";
import { DAY_KEYS, DAY_LABELS, parseOpeningHours } from "@/lib/hours";

function formatHour(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, "0")}${suffix}` : `${hour}${suffix}`;
}

export function SiteFooter({ branch }: { branch: Branch }) {
  const hours = parseOpeningHours(branch.openingHours);
  const allSame = DAY_KEYS.every(
    (d) =>
      hours[d].closed === hours.mon.closed &&
      hours[d].open === hours.mon.open &&
      hours[d].close === hours.mon.close,
  );

  return (
    <footer className="mt-16 border-t border-stone-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-stone-600 sm:grid-cols-3">
        <div className="space-y-2">
          <p className="font-display text-lg font-bold text-stone-900">{branch.name}</p>
          <p>Fresh burgers, pizzas and more — made to order.</p>
          <p className="text-xs text-stone-500">Pay cash on delivery or at pickup.</p>
        </div>
        <div className="space-y-2">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            {branch.addressLine}, {branch.city}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="size-4 shrink-0" aria-hidden />
            <a href={`tel:+91${branch.phone}`} className="hover:text-stone-900">
              +91 {branch.phone}
            </a>
          </p>
        </div>
        <div className="space-y-1">
          <p className="mb-2 flex items-center gap-2 font-medium text-stone-900">
            <Clock className="size-4" aria-hidden /> Opening hours
          </p>
          {allSame ? (
            <p>
              Every day:{" "}
              {hours.mon.closed ? "Closed" : `${formatHour(hours.mon.open)} – ${formatHour(hours.mon.close)}`}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {DAY_KEYS.map((d) => (
                <li key={d} className="flex justify-between gap-4">
                  <span>{DAY_LABELS[d]}</span>
                  <span>
                    {hours[d].closed ? "Closed" : `${formatHour(hours[d].open)} – ${formatHour(hours[d].close)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t border-stone-100 py-4 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} {branch.name} ·{" "}
        <Link href="/track" className="hover:text-stone-700">
          Track your order
        </Link>
      </div>
    </footer>
  );
}
