"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type UploadedImage = { url: string; publicId?: string | null };

const MAX_BYTES = 5 * 1024 * 1024;

async function uploadToCloudinary(file: File): Promise<UploadedImage> {
  const signRes = await fetch("/api/admin/cloudinary-sign", { method: "POST" });
  const sign = await signRes.json();
  if (!signRes.ok) throw new Error(sign.error ?? "Could not start upload");

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sign.apiKey);
  body.append("timestamp", String(sign.timestamp));
  body.append("signature", sign.signature);
  body.append("folder", sign.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Upload failed");
  return { url: data.secure_url, publicId: data.public_id };
}

export function ImageUploader({
  value,
  onChange,
  max = 8,
}: {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = max - value.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) toast.message(`Only ${max} image${max === 1 ? "" : "s"} allowed`);

    const valid = picked.filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image`);
        return false;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} is larger than 5 MB`);
        return false;
      }
      return true;
    });

    setUploading((n) => n + valid.length);
    const results = await Promise.allSettled(valid.map(uploadToCloudinary));
    setUploading((n) => n - valid.length);

    const uploaded: UploadedImage[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") uploaded.push(r.value);
      else toast.error(r.reason instanceof Error ? r.reason.message : "Upload failed");
    }
    if (uploaded.length) onChange([...value, ...uploaded].slice(0, max));
    if (inputRef.current) inputRef.current.value = "";
  }

  function move(index: number, delta: number) {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {value.map((img, i) => (
          <div key={img.url} className="group relative size-24 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
            <Image src={img.url} alt={`Image ${i + 1}`} fill sizes="96px" className="object-cover" />
            {i === 0 && max > 1 && (
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-[10px] font-semibold text-white">
                Main
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
              <button
                type="button"
                className="rounded p-0.5 text-white disabled:opacity-30"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move left"
              >
                <ArrowLeft className="size-4" />
              </button>
              <button
                type="button"
                className="rounded p-0.5 text-white"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label="Remove image"
              >
                <X className="size-4" />
              </button>
              <button
                type="button"
                className="rounded p-0.5 text-white disabled:opacity-30"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                aria-label="Move right"
              >
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        ))}

        {Array.from({ length: uploading }).map((_, i) => (
          <div key={`up-${i}`} className="flex size-24 items-center justify-center rounded-xl border border-stone-200 bg-stone-50">
            <Loader2 className="size-5 animate-spin text-stone-400" />
          </div>
        ))}

        {value.length + uploading < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex size-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone-300 text-xs font-medium text-stone-500 hover:border-brand-500 hover:text-brand-700",
            )}
          >
            <ImagePlus className="size-5" />
            Add image
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        multiple={max > 1}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        tabIndex={-1}
        aria-hidden
      />
      <p className="text-xs text-stone-500">JPG, PNG or WebP, up to 5 MB each. Square or 4:3 photos look best.</p>
    </div>
  );
}
