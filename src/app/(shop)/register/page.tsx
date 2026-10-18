import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth-guard";
import { RegisterForm } from "@/components/shop/auth-forms";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

function safePath(value?: string): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const callbackUrl = safePath((await searchParams).callbackUrl);
  if (await currentUser()) redirect(callbackUrl);

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-1 font-display text-2xl font-bold">Create your account</h1>
      <p className="mb-6 text-sm text-stone-600">Track orders and reorder your favourites.</p>
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <RegisterForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
