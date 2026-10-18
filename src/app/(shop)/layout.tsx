import { Clock } from "lucide-react";
import { getBranch, getShopStatus } from "@/server/queries/branch";
import { SiteHeader } from "@/components/shop/site-header";
import { SiteFooter } from "@/components/shop/site-footer";
import { MobileCartBar } from "@/components/shop/cart-button";

// Menu, prices and open/closed status must always be current.
export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const branch = await getBranch();
  const status = getShopStatus(branch);

  return (
    <div className="flex min-h-dvh flex-col">
      {!status.isOpen && (
        <div className="bg-stone-900 px-4 py-2 text-center text-sm text-white" role="status">
          <Clock className="mr-1.5 inline size-4 align-[-3px]" aria-hidden />
          {status.reason}. You can browse the menu and order when we open.
        </div>
      )}
      <SiteHeader branch={branch} />
      <main className="flex-1 pb-20 sm:pb-0">{children}</main>
      <SiteFooter branch={branch} />
      <MobileCartBar />
    </div>
  );
}
