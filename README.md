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

You need Node 22.13+. There is no database server to install: the site runs on Cloudflare D1
(SQLite), and Wrangler keeps a local copy of it in `.wrangler/`.

```bash
npm install
cp .env.example .env.local
npm run db:migrate                  # create the tables in the local D1 database
npm run db:seed                     # catalogue, staff, 6 months of orders, payroll…
npm run dev                         # http://localhost:9002
```

`npm run db:reset` wipes the local database and re-seeds it (it never touches Cloudflare).
`npm run preview` builds the real Worker and serves it on http://localhost:8787 with the Workers
runtime, which is the closest thing to production.

## Tests

```bash
npm run test:unit    # GST, payroll tax, leave days, Razorpay signatures, password hashing
npm run test:e2e     # browser tests against `npm run dev` on a freshly reset database
```

The end-to-end suite signs in as each role and walks the real flows: guest bag → registration →
checkout, packing and assignment, delivery with a wrong then right handover code, customer
cancellation restoring stock, the Razorpay webhook (including replay), leave request and approval,
payroll prepare/process/payslip, adding a staff member and signing in with their temporary password,
job applications, maintenance mode, restocking and the audit log, plus access-control and
sign-in lockout checks. It needs `CHROME=/path/to/chrome` if Playwright’s browser isn’t installed and
`RAZORPAY_WEBHOOK_SECRET=test_webhook_secret` in `.env.local` for the webhook test. To test the
built Worker instead, run `npm run preview` and `BASE=http://localhost:8787 npm run test:e2e`.

## Deploy to Cloudflare

Everything runs on Cloudflare’s free plan: the site is a Worker and the data lives in D1.

1. **Sign in:** `npx wrangler login` (opens your browser).
2. **Create the database:** `npx wrangler d1 create sparkle`. Copy the `database_id` it prints into
   `wrangler.jsonc`, replacing the zeros.
3. **Create the tables and demo data:**
   ```bash
   npm run db:migrate:remote
   npm run db:seed:remote          # optional demo data
   ```
4. **Set the site address:** in `wrangler.jsonc` under `vars`, set `NEXT_PUBLIC_SITE_URL` to your
   address (after the first deploy it’s `https://sparkle.<your-subdomain>.workers.dev`), and `DEMO_MODE`
   to `"1"` if you want the demo buttons on the sign-in page.
5. **Deploy:** `npm run deploy`. It builds the site and prints its URL. Run it again after each change.
6. **Payments (optional):** store the Razorpay keys as secrets (test keys first):
   ```bash
   npx wrangler secret put RAZORPAY_KEY_ID
   npx wrangler secret put RAZORPAY_KEY_SECRET
   npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
   ```
   For the webhook, add `https://<your-domain>/api/razorpay/webhook` in Razorpay with
   `payment.captured` and `order.paid`.
7. Before real customers arrive: set `DEMO_MODE` to `"0"`, change every demo password (Dashboard →
   Settings), and switch Razorpay to live keys. Dashboard → System health lists anything still outstanding.
   A custom domain can be added in the Cloudflare dashboard under Workers → sparkle → Settings → Domains.

After schema changes, run `npm run db:generate` to create a migration, then `npm run db:migrate`
(local) and `npm run db:migrate:remote` (Cloudflare).

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
- **Cloudflare Workers** via OpenNext, **Cloudflare D1** (SQLite) with **Drizzle ORM**; migrations in
  `drizzle/`, schema in `src/db/schema.ts`
- **three.js** via React Three Fiber and drei for every jewel (`src/components/three/`)
- Sessions are random tokens stored hashed in the database, sent as an HttpOnly cookie; passwords use
  PBKDF2-SHA256 (Web Crypto, fast enough for Workers’ CPU limits);
  five failed sign-ins lock an email for 15 minutes; every sensitive action is written to the audit log
- Stock is taken exactly once per order: a conditional update claims the order, then one D1 batch
  (a single transaction) moves the stock, and a `stock >= 0` check makes an oversell roll the batch back.
  Cancellations return it. Razorpay payments are verified by HMAC signature, and the webhook is idempotent
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
scripts/              seed, reset, render-products, D1 helpers
tests/                unit and end-to-end tests
```
