"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCategory } from "@/server/actions/admin/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Switch, Textarea } from "@/components/ui/form-controls";
import { ImageUploader } from "./image-uploader";

type CategoryValues = {
  name: string;
  description: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

export function CategoryForm({ id, initial }: { id: string | null; initial?: CategoryValues }) {
  const router = useRouter();
  const [values, setValues] = useState<CategoryValues>(
    initial ?? { name: "", description: "", imageUrl: null, sortOrder: 0, isActive: true },
  );
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await saveCategory(id, values);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      toast.success("Category saved");
      router.push("/admin/categories");
    });
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6" noValidate>
      <Card>
        <CardContent className="space-y-4 pt-5">
          <Field label="Name" htmlFor="name" error={errors.name}>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              placeholder="Burgers"
              required
            />
          </Field>
          <Field label="Description (optional)" htmlFor="description" error={errors.description}>
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
            />
          </Field>
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-stone-700">Image (optional)</span>
            <ImageUploader
              max={1}
              value={values.imageUrl ? [{ url: values.imageUrl }] : []}
              onChange={(imgs) => setValues({ ...values, imageUrl: imgs[0]?.url ?? null })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sort order" htmlFor="sortOrder" hint="Lower numbers show first" error={errors.sortOrder}>
              <Input
                id="sortOrder"
                type="number"
                min={0}
                value={values.sortOrder}
                onChange={(e) => setValues({ ...values, sortOrder: Number(e.target.value) || 0 })}
              />
            </Field>
            <div className="flex items-center gap-3 pt-7">
              <Switch
                id="isActive"
                label="Visible on menu"
                checked={values.isActive}
                onCheckedChange={(v) => setValues({ ...values, isActive: v })}
              />
              <label htmlFor="isActive" className="text-sm text-stone-700">
                Visible on menu
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button type="submit" loading={pending}>
          Save category
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
