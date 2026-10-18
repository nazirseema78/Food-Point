import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** For admin pages: redirects non-admins. */
export async function requireAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");
  return session.user;
}

/** For admin actions/route handlers: throws so nothing runs for non-admins. */
export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
  return session.user;
}

/** For customer pages that need a login. */
export async function requireUserPage(returnTo: string) {
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  return session.user;
}

export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}
