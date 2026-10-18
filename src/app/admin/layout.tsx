import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { requireAdminPage } from "@/server/auth-guard";
import { getBranch } from "@/server/queries/branch";
import { logoutAction } from "@/server/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { AcceptingToggle } from "@/components/admin/accepting-toggle";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  const branch = await getBranch();

  return (
    <div className="min-h-dvh bg-stone-100 lg:flex">
      <aside className="no-print bg-stone-900 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-60 lg:shrink-0 lg:flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:py-5">
          <Link href="/admin" className="font-display text-lg font-bold">
            {branch.name} <span className="text-brand-400">Admin</span>
          </Link>
          <div className="lg:mt-4">
            <AcceptingToggle value={branch.acceptingOrders} />
          </div>
        </div>
        <div className="px-3 pb-3 lg:flex-1">
          <AdminNav />
        </div>
        <div className="hidden space-y-1 border-t border-white/10 p-3 text-sm lg:block">
          <Link href="/" target="_blank" className="flex items-center gap-2 rounded-xl px-3 py-2 text-stone-300 hover:bg-white/10 hover:text-white">
            <ExternalLink className="size-4" /> View shop
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-stone-300 hover:bg-white/10 hover:text-white">
              <LogOut className="size-4" /> Log out
            </button>
          </form>
          <p className="truncate px-3 pt-2 text-xs text-stone-500">{user.email}</p>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
