// All money in the app is integer paise. Convert only at the edges.

const wholeRupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const withPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹149 for whole rupees, ₹149.50 otherwise. */
export function formatINR(paise: number): string {
  return (paise % 100 === 0 ? wholeRupees : withPaise).format(paise / 100);
}

export function rupeesToPaise(rupees: number | string): number {
  const value = typeof rupees === "string" ? Number(rupees.trim()) : rupees;
  if (!Number.isFinite(value)) return NaN;
  return Math.round(value * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}
