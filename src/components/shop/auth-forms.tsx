"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Field label="Email" htmlFor="email" error={state?.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password" error={state?.fieldErrors?.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" loading={pending}>
        Log in
      </Button>
      <p className="text-center text-sm text-stone-600">
        New here?{" "}
        <Link
          href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-semibold text-brand-700 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(registerAction, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Field label="Name" htmlFor="name" error={state?.fieldErrors?.name}>
        <Input id="name" name="name" autoComplete="name" required />
      </Field>
      <Field label="Email" htmlFor="email" error={state?.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Mobile number (optional)" htmlFor="phone" error={state?.fieldErrors?.phone}>
        <Input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        error={state?.fieldErrors?.password}
        hint="At least 8 characters"
      >
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" loading={pending}>
        Create account
      </Button>
      <p className="text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-semibold text-brand-700 hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
