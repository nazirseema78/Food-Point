# Food-Point

Online ordering website for a fast-food shop: a customer ordering site plus an admin panel to manage the menu, prices, images, orders and coupons.

**Stack:** Next.js 15 · TypeScript · Tailwind + shadcn/ui · PostgreSQL + Prisma · Auth.js · Cloudinary · Vercel

## Phase 1 features

**Customers**
- Menu with categories, search, veg/non-veg tags and out-of-stock badges
- Sizes (S/M/L) and add-ons (extra cheese, toppings)
- Cart and checkout with delivery or takeaway, coupon codes and cash on delivery / pay at pickup
- Order tracking with a status timeline
- Optional account (email + password) with order history; guest checkout allowed

**Admin (`/admin`)**
- Dashboard: today's orders, revenue and pending orders
- Products and categories: images, prices, variants, add-ons, availability, featured items
- Live orders board with a new-order sound, status updates and a printable kitchen ticket
- Coupons: flat or percentage discount, minimum order, expiry, usage limit
- Shop settings: opening hours, delivery fee, minimum order, tax %, delivery/takeaway on or off

## Roadmap

| Milestone | Status |
|---|---|
| 0. Project docs (AGENTS.md, CLAUDE.md, README) | ✅ |
| 1. Scaffold: Next.js, Tailwind, Prisma, lint/test tooling | ✅ |
| 2. Database schema and seed script | ✅ (first migration runs once the database is connected) |
| 3. Auth and admin route protection | ✅ |
| 4. Admin: categories, products, settings | ✅ |
| 5. Shop: home, menu, product modal, cart | ✅ |
| 6. Checkout, pricing engine, coupons, order creation | ✅ |
| 7. Admin orders board and customer order tracking | ✅ |
| 8. Browser QA on real data, e2e run, deploy to Vercel | ⏳ |

**Phase 2+ (later):** Razorpay online payment, SMS/WhatsApp alerts, staff roles, multiple branches, reviews, loyalty, sales reports, installable app (PWA).

## Local setup

Requirements: Node.js 20+, a PostgreSQL database (free [Neon](https://neon.tech) project or local Docker), and a free [Cloudinary](https://cloudinary.com) account.

```bash
npm install
cp .env.example .env.local  # then fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET, Cloudinary keys, ADMIN_*
npm run db:migrate          # creates the tables
npm run db:seed             # creates the admin user, shop settings, sample menu, WELCOME50 coupon
npm run dev                 # http://localhost:3000  (admin: http://localhost:3000/admin)
```

Log in at `/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then open `/admin`. Update your real shop name, phone, address and hours in **Admin → Settings**.

Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. E2E (needs a seeded DB): `npx playwright install chromium` once, then `npm run test:e2e`.

## For developers and AI agents

Read [AGENTS.md](AGENTS.md) before contributing. It covers the project rules: money is stored in paise, prices are always recomputed on the server, all input is validated with Zod, plus the definition of done.
