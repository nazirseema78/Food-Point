"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuantityStepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div className="inline-flex items-center rounded-xl border border-stone-300 bg-white">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={value === 1 ? `Remove ${label}` : `Decrease ${label}`}
        onClick={() => onChange(value - 1)}
      >
        {value === 1 ? <Trash2 /> : <Minus />}
      </Button>
      <span className="w-7 text-center text-sm font-semibold" aria-live="polite">
        {value}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(value + 1)}
        disabled={value >= 50}
      >
        <Plus />
      </Button>
    </div>
  );
}
