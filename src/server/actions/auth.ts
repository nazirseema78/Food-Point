"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import { fieldErrors } from "@/lib/validators/common";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
} | null;

function safeCallback(value: FormDataEntryValue | null): string {
  const url = typeof value === "string" ? value : "";
  // Only allow same-site relative paths.
  return url.startsWith("/") && !url.startsWith("//") ? url : "/";
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeCallback(formData.get("callbackUrl")),
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Incorrect email or password" };
    throw e; // redirect
  }
  return null;
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { name, email, phone, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { fieldErrors: { email: ["An account with this email already exists"] } };

  await db.user.create({
    data: { name, email, phone: phone ?? null, passwordHash: await bcrypt.hash(password, 12) },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: safeCallback(formData.get("callbackUrl")),
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Account created. Please log in." };
    throw e;
  }
  return null;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
