"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveProduct, setProductFlag } from "@/server/actions/admin/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, PriceInput, Select, Switch, Textarea } from "@/components/ui/form-controls";
import { ImageUploader, type UploadedImage } from "./image-uploader";

type Variant = { name: string; price: number | null };
type Addon = { name: string; price: number | null; isAvailable: boolean };
type AddonGroup = { name: string; minSelect: number; maxSelect: number; addons: Addon[] };

export type ProductFormValues = {
  name: string;
  description: string;
  categoryId: string;
  basePrice: number | null;
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  images: UploadedImage[];
  variants: Variant[];
  addonGroups: AddonGroup[];
};

const EMPTY: ProductFormValues = {
  name: "",
  description: "",
  categoryId: "",
  basePrice: null,
  isVeg: true,
  isAvailable: true,
  isFeatured: false,
  sortOrder: 0,
  images: [],
  variants: [],
  addonGroups: [],
};

export function ProductForm({
  id,
  initial,
  categories,
  isActive = true,
}: {
  id: string | null;
  initial?: ProductFormValues;
  categories: { id: string; name: string }[];
  isActive?: boolean;
}) {
  const router = useRouter();
  const [v, setV] = useState<ProductFormValues>(
    initial ?? { ...EMPTY, categoryId: categories[0]?.id ?? "" },
  );
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, start] = useTransition();
  const [archiving, startArchive] = useTransition();

  const patch = (p: Partial<ProductFormValues>) => setV((prev) => ({ ...prev, ...p }));
  const hasVariants = v.variants.length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasVariants && v.basePrice == null) {
      setErrors({ basePrice: ["Enter a price"] });
      toast.error("Enter a price");
      return;
    }
    const missingPrice =
      v.variants.some((x) => x.price == null) || v.addonGroups.some((g) => g.addons.some((a) => a.price == null));
    if (missingPrice) {
      toast.error("Every size and add-on needs a price (use 0 for free)");
      return;
    }

    start(async () => {
      const res = await saveProduct(id, {
        ...v,
        basePrice: v.basePrice ?? 0,
        variants: v.variants.map((x) => ({ name: x.name, price: x.price ?? 0 })),
        addonGroups: v.addonGroups.map((g) => ({
          ...g,
          addons: g.addons.map((a) => ({ ...a, price: a.price ?? 0 })),
        })),
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      toast.success("Product saved");
      router.push("/admin/products");
      router.refresh();
    });
  }

  function toggleArchive() {
    if (!id) return;
    if (isActive && !confirm("Archive this product? It will be hidden from the menu. Past orders are kept.")) return;
    startArchive(async () => {
      const res = await setProductFlag(id, "isActive", !isActive);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(isActive ? "Product archived" : "Product restored");
      router.push("/admin/products");
      router.refresh();
    });
  }

  // ----- variants -----
  const setVariant = (i: number, p: Partial<Variant>) =>
    patch({ variants: v.variants.map((x, j) => (j === i ? { ...x, ...p } : x)) });

  // ----- add-on groups -----
  const setGroup = (i: number, p: Partial<AddonGroup>) =>
    patch({ addonGroups: v.addonGroups.map((g, j) => (j === i ? { ...g, ...p } : g)) });
  const setAddon = (gi: number, ai: number, p: Partial<Addon>) =>
    setGroup(gi, { addons: v.addonGroups[gi].addons.map((a, j) => (j === ai ? { ...a, ...p } : a)) });

  return (
    <form onSubmit={submit} className="grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]" noValidate>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Product name" htmlFor="name" error={errors.name}>
              <Input id="name" value={v.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Classic Chicken Burger" />
            </Field>
            <Field label="Description" htmlFor="description" error={errors.description}>
              <Textarea
                id="description"
                value={v.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="Crispy chicken patty, lettuce, cheese and our house mayo."
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" htmlFor="categoryId" error={errors.categoryId}>
                <Select id="categoryId" value={v.categoryId} onChange={(e) => patch({ categoryId: e.target.value })}>
                  {categories.length === 0 && <option value="">Create a category first</option>}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Price"
                htmlFor="basePrice"
                error={errors.basePrice}
                hint={hasVariants ? "Set by sizes below" : undefined}
              >
                {hasVariants ? (
                  <Input id="basePrice" disabled value="Uses size prices" />
                ) : (
                  <PriceInput id="basePrice" value={v.basePrice} onChange={(p) => patch({ basePrice: p })} invalid={!!errors.basePrice} />
                )}
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader value={v.images} onChange={(images) => patch({ images })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sizes</CardTitle>
            <p className="text-sm text-stone-500">Optional. E.g. Regular / Medium / Large — each with its full price.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {v.variants.map((variant, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  aria-label={`Size ${i + 1} name`}
                  placeholder="Medium"
                  value={variant.name}
                  onChange={(e) => setVariant(i, { name: e.target.value })}
                />
                <PriceInput
                  className="w-36 shrink-0"
                  value={variant.price}
                  onChange={(price) => setVariant(i, { price })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove size"
                  onClick={() => patch({ variants: v.variants.filter((_, j) => j !== i) })}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => patch({ variants: [...v.variants, { name: "", price: v.basePrice }] })}
            >
              <Plus /> Add size
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add-ons</CardTitle>
            <p className="text-sm text-stone-500">Optional extras like toppings, cheese or a drink.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {v.addonGroups.map((group, gi) => (
              <div key={gi} className="space-y-3 rounded-xl border border-stone-200 p-4">
                <div className="flex items-end gap-2">
                  <Field label="Group name" htmlFor={`g-${gi}`} className="flex-1">
                    <Input
                      id={`g-${gi}`}
                      placeholder="Extra toppings"
                      value={group.name}
                      onChange={(e) => setGroup(gi, { name: e.target.value })}
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove group"
                    onClick={() => patch({ addonGroups: v.addonGroups.filter((_, j) => j !== gi) })}
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Min choices" htmlFor={`gmin-${gi}`} hint="0 = optional">
                    <Input
                      id={`gmin-${gi}`}
                      type="number"
                      min={0}
                      value={group.minSelect}
                      onChange={(e) => setGroup(gi, { minSelect: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </Field>
                  <Field label="Max choices" htmlFor={`gmax-${gi}`} hint="1 = pick one">
                    <Input
                      id={`gmax-${gi}`}
                      type="number"
                      min={1}
                      value={group.maxSelect}
                      onChange={(e) => setGroup(gi, { maxSelect: Math.max(1, Number(e.target.value) || 1) })}
                    />
                  </Field>
                </div>
                <div className="space-y-2">
                  {group.addons.map((addon, ai) => (
                    <div key={ai} className="flex items-center gap-2">
                      <Input
                        aria-label="Add-on name"
                        placeholder="Extra cheese"
                        value={addon.name}
                        onChange={(e) => setAddon(gi, ai, { name: e.target.value })}
                      />
                      <PriceInput
                        className="w-28 shrink-0"
                        value={addon.price}
                        onChange={(price) => setAddon(gi, ai, { price })}
                      />
                      <Switch
                        label="Add-on available"
                        checked={addon.isAvailable}
                        onCheckedChange={(isAvailable) => setAddon(gi, ai, { isAvailable })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove add-on"
                        onClick={() => setGroup(gi, { addons: group.addons.filter((_, j) => j !== ai) })}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setGroup(gi, { addons: [...group.addons, { name: "", price: null, isAvailable: true }] })
                    }
                  >
                    <Plus /> Add option
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                patch({
                  addonGroups: [
                    ...v.addonGroups,
                    { name: "", minSelect: 0, maxSelect: 3, addons: [{ name: "", price: null, isAvailable: true }] },
                  ],
                })
              }
            >
              <Plus /> Add add-on group
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SwitchRow label="In stock" hint="Turn off when sold out" checked={v.isAvailable} onChange={(isAvailable) => patch({ isAvailable })} />
            <SwitchRow label="Bestseller" hint="Shown on the home page" checked={v.isFeatured} onChange={(isFeatured) => patch({ isFeatured })} />
            <SwitchRow label="Vegetarian" hint="Shows the green veg mark" checked={v.isVeg} onChange={(isVeg) => patch({ isVeg })} />
            <Field label="Sort order" htmlFor="sortOrder" hint="Lower numbers show first">
              <Input
                id="sortOrder"
                type="number"
                min={0}
                value={v.sortOrder}
                onChange={(e) => patch({ sortOrder: Number(e.target.value) || 0 })}
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button type="submit" size="lg" loading={pending}>
            Save product
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          {id && (
            <Button type="button" variant="ghost" onClick={toggleArchive} loading={archiving} className="text-stone-600">
              {isActive ? (
                <>
                  <Archive /> Archive product
                </>
              ) : (
                <>
                  <ArchiveRestore /> Restore product
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-stone-800">{label}</p>
        <p className="text-xs text-stone-500">{hint}</p>
      </div>
      <Switch label={label} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
