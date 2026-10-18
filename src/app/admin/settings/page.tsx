import { getBranch } from "@/server/queries/branch";
import { parseOpeningHours } from "@/lib/hours";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const branch = await getBranch();
  return (
    <>
      <PageHeader title="Settings" description="Shop details, delivery charges and opening hours." />
      <SettingsForm
        initial={{
          name: branch.name,
          phone: branch.phone,
          email: branch.email ?? "",
          addressLine: branch.addressLine,
          city: branch.city,
          logoUrl: branch.logoUrl,
          acceptingOrders: branch.acceptingOrders,
          deliveryEnabled: branch.deliveryEnabled,
          takeawayEnabled: branch.takeawayEnabled,
          deliveryFee: branch.deliveryFee,
          freeDeliveryAbove: branch.freeDeliveryAbove,
          minOrder: branch.minOrder,
          taxPercent: String(branch.taxRateBps / 100),
          openingHours: parseOpeningHours(branch.openingHours),
        }}
      />
    </>
  );
}
