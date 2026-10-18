import "server-only";
import { slugify } from "@/lib/utils";

export async function uniqueSlug(
  name: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name) || "item";
  let slug = base;
  for (let i = 2; await isTaken(slug); i++) slug = `${base}-${i}`;
  return slug;
}
