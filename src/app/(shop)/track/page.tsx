import type { Metadata } from "next";
import { TrackForm } from "@/components/shop/track-form";

export const metadata: Metadata = { title: "Track your order" };

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 font-display text-2xl font-bold">Track your order</h1>
      <p className="mb-6 text-sm text-stone-600">
        Enter your order number and the mobile number you ordered with.
      </p>
      <TrackForm />
    </div>
  );
}
