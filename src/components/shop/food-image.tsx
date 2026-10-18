import Image from "next/image";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

export function FoodImage({
  src,
  alt,
  sizes = "(max-width: 640px) 50vw, 300px",
  className,
  priority,
}: {
  src: string | null | undefined;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-brand-100 to-amber-100", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-brand-400">
          <UtensilsCrossed className="size-1/4 min-h-6 min-w-6" aria-hidden />
        </div>
      )}
    </div>
  );
}
