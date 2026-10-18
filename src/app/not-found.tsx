import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-display text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="text-xl font-semibold">This page isn&apos;t on the menu</h1>
      <Link href="/" className={buttonVariants()}>
        Back to home
      </Link>
    </div>
  );
}
