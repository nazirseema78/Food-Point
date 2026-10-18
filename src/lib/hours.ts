export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export type DayHours = { open: string; close: string; closed: boolean };
export type OpeningHours = Record<DayKey, DayHours>;

export const DEFAULT_HOURS: OpeningHours = Object.fromEntries(
  DAY_KEYS.map((d) => [d, { open: "11:00", close: "23:00", closed: false }]),
) as OpeningHours;

const WEEKDAY_TO_KEY: Record<string, DayKey> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function zonedNow(now: Date, timeZone: string): { day: DayKey; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: WEEKDAY_TO_KEY[get("weekday")],
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/** Handles windows that cross midnight, e.g. 18:00–02:00. */
export function isWithinHours(hours: OpeningHours, now: Date, timeZone: string): boolean {
  const { day, minutes } = zonedNow(now, timeZone);
  const today = hours[day];
  if (today && !today.closed) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (open < close ? minutes >= open && minutes < close : minutes >= open) return true;
  }
  const prevKey = DAY_KEYS[(DAY_KEYS.indexOf(day) + 6) % 7];
  const prev = hours[prevKey];
  if (prev && !prev.closed) {
    const open = toMinutes(prev.open);
    const close = toMinutes(prev.close);
    if (close <= open && minutes < close) return true;
  }
  return false;
}

export function parseOpeningHours(value: unknown): OpeningHours {
  if (!value || typeof value !== "object") return DEFAULT_HOURS;
  const raw = value as Partial<Record<DayKey, Partial<DayHours>>>;
  return Object.fromEntries(
    DAY_KEYS.map((d) => [
      d,
      {
        open: raw[d]?.open ?? DEFAULT_HOURS[d].open,
        close: raw[d]?.close ?? DEFAULT_HOURS[d].close,
        closed: raw[d]?.closed ?? false,
      },
    ]),
  ) as OpeningHours;
}

/** Start of the current day in India (IST has no DST, fixed +05:30). */
export function startOfTodayIST(now: Date = new Date()): Date {
  const offsetMs = 330 * 60 * 1000;
  const ist = new Date(now.getTime() + offsetMs);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - offsetMs);
}
