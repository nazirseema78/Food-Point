# AGENTS.md — Food-Point

Instructions for any AI coding agent (Claude Code, Codex, Cursor, Copilot, etc.) and human contributors working on this repo. **This is the source of truth for project rules.** `CLAUDE.md` imports this file.

## 1. Project overview

Food-Point is an online ordering website for a single fast-food shop in India (burgers, pizzas, etc.). It has two sides:

- **Shop (customer side):** browse the menu, customise items (sizes, add-ons), add them to a cart, and check out. Checkout has delivery or takeaway, coupon codes and **cash on delivery / pay at pickup**. Customers can track their orders. They can create an account (email + password) or check out as a guest.
- **Admin (`/admin`):** one admin manages categories, products (images, prices, variants, add-ons, availability), orders (live board with sound alert, status updates, kitchen ticket), coupons and shop settings (hours, delivery fee, minimum order, tax).

It is built to grow. Phase 2+ plans include Razorpay online payments, staff roles, multiple branches and SMS/WhatsApp notifications. **Do not build phase 2 features unless asked**, but don't make choices that block them (see §6).

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React Server Components, Server Actions), TypeScript `strict` |
| Styling / UI | Tailwind CSS v4, shadcn-style primitives in `src/components/ui` (hand-written, Radix Dialog), lucide-react icons, sonner toasts |
| Database | PostgreSQL (Neon/Supabase in prod, local Docker or Neon branch in dev) |
| ORM | Prisma (migrations committed in `prisma/migrations`) |
| Auth | Auth.js (NextAuth v5), credentials provider, bcrypt password hashes, JWT sessions with `role` claim |
| Validation | Zod (shared schemas in `src/lib/validators/`) |
| Images | Cloudinary (signed uploads from admin, transforms on delivery, `next/image`) |
| Client state | Zustand (cart only, persisted to localStorage) |
| Forms | Controlled client components calling Server Actions (`useTransition`), or `useActionState` for simple forms |
| Tests | Vitest 3 (unit), Playwright (e2e) |
| Hosting | Vercel |

Don't add new runtime dependencies without a clear reason. Prefer what's already installed.

## 3. Folder layout

```
prisma/              schema.prisma, migrations/, seed.ts
src/auth.ts          Auth.js setup (credentials). src/auth.config.ts = edge-safe part used by middleware
src/middleware.ts    protects /admin and /account
src/app/(shop)/      customer pages: /, /menu, /cart, /checkout, /orders/[orderNumber], /track, /login, /register, /account
src/app/admin/       admin pages (protected): dashboard, orders (+ print ticket), products, categories, coupons, settings
src/app/api/         route handlers only where needed (Auth.js, Cloudinary upload signature, admin order polling)
src/components/ui/   UI primitives (button, form-controls, card, badge, dialog)
src/components/shop/ customer-side components
src/components/admin/admin-side components
src/components/order/order display shared by shop and admin
src/lib/             db.ts, env.ts, money.ts, pricing.ts, hours.ts, order-status.ts, image-loader.ts, utils.ts
src/lib/validators/  Zod schemas per domain
src/server/          order-service.ts (create order / change status), cart.ts (server re-pricing),
                     order-access.ts (signed guest-order cookie), auth-guard.ts, notify.ts
src/server/actions/  Server Actions: auth.ts, checkout.ts, admin/{catalog,coupons,settings,orders}.ts
src/server/queries/  read-only data access used by Server Components
src/stores/          Zustand stores (cart)
tests/unit/          Vitest
tests/e2e/           Playwright
```

## 4. Commands

```bash
npm run dev          # start dev server at http://localhost:3000
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Vitest unit tests
npm run test:e2e     # Playwright
npm run db:migrate   # prisma migrate dev
npm run db:seed      # seed admin user, branch, sample menu
npm run db:studio    # Prisma Studio
```

## 5. Non-negotiable rules

### Money
- **All money is stored and computed as integer paise** (`Int`). ₹149.00 = `14900`. Never use floats for money.
- Format money only at the UI edge with `formatINR(paise)` from `src/lib/money.ts`.
- Admin price inputs accept rupees and convert with `rupeesToPaise()` before saving.

### Pricing & orders
- `src/lib/pricing.ts` → `calculateOrder()` is the **single** place that computes subtotal, add-ons, discount, delivery fee, tax and total. The cart preview and order creation both use it.
- **Never trust prices from the client.** On order creation the server re-loads products, variants, add-ons, the coupon and branch settings from the DB and recomputes everything. The client sends only IDs and quantities.
- `OrderItem` stores a **snapshot** (product name, variant name, add-on names and prices, unit price). Later product edits must not change past orders.
- Order creation runs in a single Prisma `$transaction`. That transaction creates the order and its items, records a status event and increments coupon usage.
- Order status changes go through one function (`changeOrderStatus` in `src/server/order-service.ts`). It validates the transition (PENDING → CONFIRMED → PREPARING → READY / OUT_FOR_DELIVERY → COMPLETED / DELIVERED; CANCELLED from any non-final state) and writes an `OrderStatusEvent`.
- Reject orders when the shop is closed, below minimum order, or containing unavailable items.

### Security
- Every Server Action and route handler **validates input with Zod** and **checks auth/role** on the server. Client-side checks are UX only.
- `/admin/**` is protected by `middleware.ts` **and** by `requireAdmin()` inside each admin action/page.
- Cloudinary uploads use server-generated signatures. The API secret never reaches the client.
- Guest order tracking requires order number **and** phone number.
- Never log passwords, session tokens or full addresses.

### Data
- Products and categories are **soft-deleted** (`isActive = false`), never hard-deleted, because orders reference them.
- Every schema change ships with a Prisma migration (`npm run db:migrate -- --name <change>`). **Never edit a migration that has already been committed.**
- Slugs are unique and generated from names.

### Config
- Local secrets live in `.env.local` (git-ignored). Prisma CLI and seed scripts must load it too (via `dotenv-cli -e .env.local`), since Prisma reads only `.env` by default.
- Never commit `.env*` files (except `.env.example`). Every new env var must be added to `.env.example` with a comment.
- Access service env vars through `src/lib/env.ts` (Zod-validated, lazy), not `process.env` scattered around.

## 6. Design for growth (don't block phase 2)

- Store/order settings live on a `Branch` row (one seeded). New queries should accept a `branchId` even if there's only one branch today.
- `Role` enum is `CUSTOMER | ADMIN` today. Write role checks as helpers (`requireAdmin()`, later `requireRole()`), never inline string comparisons everywhere.
- `paymentMethod` is an enum (`COD` today, `RAZORPAY` later), and `paymentStatus` exists from day one.
- Keep notification sending behind a small interface (`src/server/notify.ts`) so SMS/WhatsApp/email can be added later.

## 7. Code style

- TypeScript strict, no `any` (use `unknown` + narrowing). Prefer types inferred from Zod/Prisma.
- Server Components by default. Add `"use client"` only for interactivity.
- Data reads go in `src/server/queries`, mutations in `src/server/actions`. Components don't call Prisma directly.
- Server Actions return `{ ok: true, data } | { ok: false, error }`. They don't throw for expected validation errors.
- After mutations, call `revalidatePath`/`revalidateTag` for affected pages.
- Name files in kebab-case, components in PascalCase, hooks `useX`.
- Mobile-first UI. Every page must work at 360px width. Use accessible labels on all form fields and buttons.
- UI text is in English. Currency is ₹ and phone numbers are Indian 10-digit (`^[6-9]\d{9}$`).
- Comments explain *why*, not *what*.

## 8. Definition of done

A change is done only when:
1. `npm run lint`, `npm run typecheck` and `npm test` pass.
2. Any change to pricing, coupons or order status has unit tests.
3. New env vars are in `.env.example`, and new schema changes have a migration.
4. The feature is checked in the browser on mobile and desktop widths.
5. No secrets, `console.log` debugging or commented-out code are left behind.

## 9. Git conventions

- Branch per feature: `feat/<short-name>`, `fix/<short-name>`.
- Conventional commits: `feat: add coupon validation`, `fix: ...`, `chore: ...`, `docs: ...`.
- Keep PRs focused on one feature. Describe what changed and how it was tested.

## 10. Don't touch without asking

- Committed migrations in `prisma/migrations/`
- `.env` / secrets
- Anything listed as phase 2 (payments gateway, staff roles, multi-branch UI)
