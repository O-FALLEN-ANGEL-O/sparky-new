# Sparkle

An online store and back office for a fine-jewellery house in Mangaluru. Customers browse hallmarked
gold and certified diamonds, turn pieces in 3D, and pay online or in cash on delivery. Staff run
orders, stock, deliveries, people and payroll from one dashboard, each seeing only what their role needs.

Every piece of jewellery on the site — the scroll-driven homepage story, the 3D viewer and all the
product photos — is built in code with three.js, so there are no model files or stock photos to license.

## What it does

**Customers**
- Homepage story: four pieces (solitaire, temple necklace, chandbalis, kangan) that turn and change as you scroll
- Shop with filters for collection, metal, stone, price and availability, plus search
- Product pages with three studio photos and an interactive 3D view
- A bag that works signed out (cookie) and follows you after you sign in
- Checkout with saved addresses, **cash on delivery** and **Razorpay** (UPI, cards, netbanking); 3% GST
- Order tracking with a timeline and a **6-digit handover code** for the delivery partner
- Cancel before packing (stock goes back on sale), wishlist, addresses, profile and password
- Careers page with applications

**Staff** (`/dashboard`, menu filtered by role)

| Role | Sees |
|---|---|
| Owner | Everything, plus store settings and maintenance mode |
| Admin | Orders, products, inventory, deliveries, customers, analytics, roles, security, audit log, system health |
| Manager | Orders, deliveries, inventory, their team, tasks, leave approvals |
| HR | People, leave, payroll, onboarding, recruitment, announcements, reports |
| Employee | Their tasks, leave balance and requests, payslips, company news |
| Shareholder | Sales KPIs, analytics, insights, reports |
| Delivery partner | A phone-friendly list of their deliveries at `/delivery`, with code entry |

Highlights: sales analytics with period comparison, insights worked out from your own data (sell-out
forecasts, slow movers, unpaid orders, cancellation rate), CSV reports, stock movements with history,
Indian payroll (PF, professional tax, new-regime TDS, unpaid-leave deductions), onboarding checklists
created automatically for new hires, a recruitment pipeline, active-session management, failed-login
monitoring and a full audit log.

## Demo accounts

After seeding, every account uses the password **`Sparkle@123`**. With `DEMO_MODE=1` the sign-in page
offers one-click buttons for each.

| Email | Role |
|---|---|
| customer@sparkle.com | Customer |
| owner@sparkle.com | Owner |
| admin@sparkle.com | Admin |
| manager@sparkle.com | Manager |
| hr@sparkle.com | HR |
| employee@sparkle.com | Employee |
| shareholder@sparkle.com | Shareholder |
| delivery@sparkle.com | Delivery partner |

## Run it locally

You need Node 20+ and PostgreSQL 14+.

```bash
npm install
cp .env.example .env.local          # then set DATABASE_URL
npm run db:migrate                  # create tables
npm run db:seed                     # catalogue, staff, 6 months of orders, payroll…
npm run dev                         # http://localhost:9002
```

`npm run db:reset` drops everything and re-seeds (refuses to run in production).

## Tests

```bash
npm run test:unit    # GST, payroll tax, leave days, Razorpay signature checks
npm run test:e2e     # browser tests against `npm run dev` on a freshly reset database
```

The end-to-end suite signs in as each role and walks the real flows: guest bag → registration →
checkout, packing and assignment, delivery with a wrong then right handover code, customer
cancellation restoring stock, the Razorpay webhook (including replay), leave request and approval,
payroll prepare/process/payslip, adding a staff member and signing in with their temporary password,
job applications, maintenance mode, restocking and the audit log, plus access-control and
sign-in lockout checks. It needs `CHROME=/path/to/chrome` if Playwright’s browser isn’t installed, and
`RAZORPAY_WEBHOOK_SECRET=test_webhook_secret` in `.env.local` for the webhook test.

## Deploy to Vercel

1. **Create a Postgres database.** Neon’s free tier works well (Vercel → Storage → Neon also works).
   Copy the connection string, including `?sslmode=require`.
2. **Create the tables and data** from your computer, pointing at that database:
   ```bash
   DATABASE_URL="postgres://…" npm run db:migrate
   DATABASE_URL="postgres://…" npm run db:seed     # optional demo data
   ```
3. **Import the repo in Vercel** and add environment variables: `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`
   (your Vercel URL), and `DEMO_MODE=1` if you want the demo buttons. The defaults for build and output are fine.
4. **Payments (optional):** add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (test keys first). For the
   webhook, add `https://<your-domain>/api/razorpay/webhook` in Razorpay with `payment.captured` and
   `order.paid`, and set `RAZORPAY_WEBHOOK_SECRET`.
5. Before real customers arrive: set `DEMO_MODE=0`, change every demo password (Dashboard → Settings),
   and switch Razorpay to live keys. Dashboard → System health lists anything still outstanding.

After schema changes, run `npm run db:generate` to create a migration, then `npm run db:migrate` against each database.

## Product photos

Photos in `public/products` and `public/collections` are rendered from the same 3D models the site
uses. After adding a piece in the dashboard (choose its “3D design”), shoot its photos with the dev
server running:

```bash
npm run render:products -- --only=your-piece-slug
```

Existing images are kept unless you pass `--force`. Until photos exist, the store shows a placeholder.
The studio page that the renderer uses (`/studio`) is switched off in production.

## How it’s built

- **Next.js 15** (App Router, server components and server actions), **React 19**, TypeScript, Tailwind
- **PostgreSQL** with **Drizzle ORM**; migrations in `drizzle/`, schema in `src/db/schema.ts`
- **three.js** via React Three Fiber and drei for every jewel (`src/components/three/`)
- Sessions are random tokens stored hashed in the database, sent as an HttpOnly cookie; passwords use bcrypt;
  five failed sign-ins lock an email for 15 minutes; every sensitive action is written to the audit log
- Stock is taken inside a database transaction with row locks, exactly once per order; cancellations
  return it. Razorpay payments are verified by HMAC signature, and the webhook is idempotent
- Recharts for the two time-series charts; everything else is plain HTML so it reads well on any screen

```
src/
  app/(store)/        storefront, account, checkout, careers
  app/dashboard/      staff dashboard pages
  app/delivery/       delivery partner app
  app/actions/        server actions (auth, store, checkout, staff, people, delivery)
  components/three/   procedural jewellery, studio lighting, scroll story, viewer
  db/                 Drizzle schema and client
  lib/server/         auth, cart, orders, analytics, people, Razorpay, settings
scripts/              migrate, seed, reset, render-products
tests/                unit and end-to-end tests
```
