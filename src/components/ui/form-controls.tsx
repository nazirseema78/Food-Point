import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-stone-100 aria-[invalid=true]:border-red-500";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldBase, "h-10", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldBase, "min-h-20 py-2", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(fieldBase, "h-10 pr-8", className)} {...props} />
  ),
);
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-stone-700", className)} {...props} />;
}

export function FieldError({ messages }: { messages?: string[] | string }) {
  const list = typeof messages === "string" ? [messages] : messages;
  if (!list?.length) return null;
  return <p className="text-xs text-red-600">{list[0]}</p>;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string[] | string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-stone-500">{hint}</p>}
      <FieldError messages={error} />
    </div>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  id,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label: string;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50",
        checked ? "bg-brand-600" : "bg-stone-300",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

/** Rupee input that reports paise. Keeps the typed text while editing. */
export function PriceInput({
  value,
  onChange,
  id,
  placeholder = "0",
  invalid,
  className,
}: {
  value: number | null;
  onChange: (paise: number | null) => void;
  id?: string;
  placeholder?: string;
  invalid?: boolean;
  className?: string;
}) {
  const format = (p: number | null) => (p == null ? "" : String(p / 100));
  const [text, setText] = React.useState(format(value));
  const [prevValue, setPrevValue] = React.useState(value);
  // Sync when the parent changes the value (e.g. form reset).
  if (prevValue !== value) {
    setPrevValue(value);
    setText(format(value));
  }
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-stone-500">
        ₹
      </span>
      <Input
        id={id}
        inputMode="decimal"
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        className="pl-7"
        value={text}
        onChange={(e) => {
          const next = e.target.value.replace(/[^\d.]/g, "");
          setText(next);
          const paise = next === "" ? null : Math.round(Number(next) * 100);
          const out = paise != null && Number.isFinite(paise) ? paise : null;
          setPrevValue(out);
          onChange(out);
        }}
      />
    </div>
  );
}
