import Link from "next/link";
import { LayoutDashboard, LogIn, User } from "lucide-react";
import { auth } from "@/auth";
import type { Branch } from "@/server/queries/branch";
import { CartButton } from "./cart-button";

export async function SiteHeader({ branch }: { branch: Branch }) {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2" aria-label={`${branch.name} home`}>
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 font-display text-lg font-extrabold text-white">
            {branch.name.charAt(0)}
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-stone-900">{branch.name}</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 text-sm font-medium text-stone-600 sm:flex" aria-label="Main">
          <Link href="/menu" className="rounded-lg px-3 py-2 hover:bg-stone-100 hover:text-stone-900">
            Menu
          </Link>
          <Link href="/track" className="rounded-lg px-3 py-2 hover:bg-stone-100 hover:text-stone-900">
            Track order
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/menu"
            className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 sm:hidden"
          >
            Menu
          </Link>
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="inline-flex size-10 items-center justify-center rounded-xl text-stone-700 hover:bg-stone-100"
              aria-label="Admin dashboard"
              title="Admin dashboard"
            >
              <LayoutDashboard className="size-5" />
            </Link>
          )}
          <Link
            href={user ? "/account" : "/login"}
            className="inline-flex size-10 items-center justify-center rounded-xl text-stone-700 hover:bg-stone-100"
            aria-label={user ? "My account" : "Log in"}
            title={user ? "My account" : "Log in"}
          >
            {user ? <User className="size-5" /> : <LogIn className="size-5" />}
          </Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
