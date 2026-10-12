/**
 * Seed a realistic Sparkle store: catalog, staff for every role, customers,
 * six months of orders with deliveries, inventory history, tasks, leave,
 * payroll, recruiting and audit data. Deterministic (seeded RNG).
 *
 *   npm run db:seed          (expects an empty, migrated database; see db:reset)
 */
import bcrypt from 'bcryptjs'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as s from '../src/db/schema'
import { orderTotals } from '../src/lib/pricing'
import { calculatePayslip } from '../src/lib/payroll'
import { daysInMonthOverlap, workingDays } from '../src/lib/leave'
import { loadEnv } from './env'

loadEnv()
const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')
const pool = new Pool({ connectionString: url, ssl: /sslmode=require|neon\.tech|supabase\.co/.test(url) ? { rejectUnauthorized: false } : undefined })
const db = drizzle(pool, { schema: s })

// ------------------------------------------------------------------ rng
let seed = 20260712
function rand() {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const between = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1))
const daysAgo = (d: number, hour = between(9, 21)) => {
  const t = new Date()
  t.setDate(t.getDate() - d)
  t.setHours(hour, between(0, 59), between(0, 59), 0)
  return t
}
const iso = (d: Date) => d.toISOString().slice(0, 10)

export const DEMO_PASSWORD = 'Sparkle@123'

// -------------------------------------------------------------- catalog
const CATEGORIES = [
  { slug: 'rings', name: 'Rings', jewelType: 'ring', description: 'Solitaires, bands and cocktail rings for every promise and celebration.' },
  { slug: 'necklaces', name: 'Necklaces', jewelType: 'necklace', description: 'Temple classics, diamond rivières and heirloom chokers.' },
  { slug: 'pendants', name: 'Pendants', jewelType: 'pendant', description: 'Everyday pendants with a story worth wearing close.' },
  { slug: 'earrings', name: 'Earrings', jewelType: 'earrings', description: 'Studs, drops, jhumkas and chandbalis.' },
  { slug: 'bracelets', name: 'Bracelets', jewelType: 'bracelet', description: 'Tennis bracelets, links and charms.' },
  { slug: 'bangles', name: 'Bangles', jewelType: 'bangle', description: 'Kangans and kadas, plain gold to polki.' },
] as const

type P = {
  slug: string
  design: (typeof s.designEnum.enumValues)[number]
  name: string
  cat: (typeof CATEGORIES)[number]['slug']
  metal: (typeof s.metalEnum.enumValues)[number]
  gem: (typeof s.gemEnum.enumValues)[number]
  purity: string
  weight: number
  carat?: number
  price: number
  compare?: number
  stock: number
  featured?: boolean
  rating: number
  reviews: number
  description: string
}

const PRODUCTS: P[] = [
  { slug: 'aurelia-solitaire-ring', design: 'solitaire', name: 'Aurelia Solitaire Ring', cat: 'rings', metal: 'platinum', gem: 'diamond', purity: 'PT950', weight: 4.2, carat: 0.75, price: 189000, stock: 9, featured: true, rating: 4.9, reviews: 128,
    description: 'A single round brilliant diamond, lifted on a six-prong platinum crown so light reaches it from every side. Our most-chosen engagement ring, finished by hand in our Mangaluru atelier.' },
  { slug: 'rani-emerald-cocktail-ring', design: 'cocktail', name: 'Rani Emerald Cocktail Ring', cat: 'rings', metal: 'yellow_gold', gem: 'emerald', purity: '22K', weight: 6.8, carat: 1.2, price: 142000, stock: 6, rating: 4.7, reviews: 41,
    description: 'A deep Zambian emerald set in 22K gold with a hand-engraved gallery. Made for weddings, worn long after.' },
  { slug: 'rose-halo-promise-ring', design: 'halo', name: 'Rose Halo Promise Ring', cat: 'rings', metal: 'rose_gold', gem: 'diamond', purity: '18K', weight: 3.1, carat: 0.3, price: 58500, compare: 64000, stock: 22, rating: 4.8, reviews: 96,
    description: 'A soft pink 18K rose gold band with a halo of pavé diamonds that makes a modest centre stone look twice its size.' },
  { slug: 'classic-gold-band', design: 'band', name: 'Classic Gold Band', cat: 'rings', metal: 'yellow_gold', gem: 'none', purity: '22K', weight: 5.0, price: 62000, stock: 30, rating: 4.6, reviews: 210,
    description: 'A comfort-fit 22K gold band with a high mirror polish. Engraving inside the band is free.' },
  { slug: 'neelam-eternity-band', design: 'eternity', name: 'Neelam Eternity Band', cat: 'rings', metal: 'white_gold', gem: 'sapphire', purity: '18K', weight: 3.6, carat: 1.0, price: 96000, stock: 11, rating: 4.7, reviews: 37,
    description: 'Calibré-cut Ceylon blue sapphires set all the way round in 18K white gold. Stacks beautifully with a solitaire.' },
  { slug: 'maharani-temple-necklace', design: 'temple', name: 'Maharani Temple Necklace', cat: 'necklaces', metal: 'yellow_gold', gem: 'ruby', purity: '22K', weight: 38, carat: 3.2, price: 485000, stock: 3, featured: true, rating: 5.0, reviews: 19,
    description: 'Temple-work lakshmi coins and cabochon rubies strung on a 22K gold collar, made by a family of karigars who have worked with us for three generations.' },
  { slug: 'riviere-diamond-necklace', design: 'riviere', name: 'Rivière Diamond Necklace', cat: 'necklaces', metal: 'white_gold', gem: 'diamond', purity: '18K', weight: 18, carat: 4.5, price: 725000, stock: 2, rating: 4.9, reviews: 12,
    description: 'An unbroken line of graduated diamonds in 18K white gold. Every stone is IGI certified and matched by eye.' },
  { slug: 'moti-pearl-choker', design: 'pearl_strand', name: 'Moti Pearl Choker', cat: 'necklaces', metal: 'yellow_gold', gem: 'pearl', purity: '18K', weight: 22, price: 128000, stock: 8, rating: 4.6, reviews: 33,
    description: 'Three strands of lustrous freshwater pearls finished with an 18K gold clasp. Equally at home with a saree or a little black dress.' },
  { slug: 'panna-drop-necklace', design: 'drop_necklace', name: 'Panna Drop Necklace', cat: 'necklaces', metal: 'yellow_gold', gem: 'emerald', purity: '22K', weight: 16, carat: 2.0, price: 236000, stock: 5, rating: 4.8, reviews: 22,
    description: 'Pear-shaped emerald drops falling from a fine 22K gold chain, each stone hand-picked for colour.' },
  { slug: 'heartline-diamond-pendant', design: 'heart', name: 'Heartline Diamond Pendant', cat: 'pendants', metal: 'rose_gold', gem: 'diamond', purity: '18K', weight: 2.4, carat: 0.25, price: 42500, stock: 34, featured: true, rating: 4.8, reviews: 154,
    description: 'An open rose gold heart traced with diamonds, on an adjustable 16–18 inch chain. Our best-loved gift.' },
  { slug: 'om-gold-pendant', design: 'medallion', name: 'Om Gold Pendant', cat: 'pendants', metal: 'yellow_gold', gem: 'none', purity: '22K', weight: 3.2, price: 38900, stock: 40, rating: 4.7, reviews: 88,
    description: 'A sculpted Om in solid 22K gold, polished on the front and matte on the reverse.' },
  { slug: 'manik-teardrop-pendant', design: 'teardrop', name: 'Manik Teardrop Pendant', cat: 'pendants', metal: 'yellow_gold', gem: 'ruby', purity: '18K', weight: 3.0, carat: 0.8, price: 67000, stock: 14, rating: 4.6, reviews: 27,
    description: 'A Burmese-red ruby teardrop in a fine 18K gold bezel. Comes with an 18 inch cable chain.' },
  { slug: 'nazar-sapphire-pendant', design: 'evil_eye', name: 'Nazar Sapphire Pendant', cat: 'pendants', metal: 'white_gold', gem: 'sapphire', purity: '18K', weight: 1.8, carat: 0.2, price: 32500, stock: 26, rating: 4.5, reviews: 61,
    description: 'A protective evil-eye in blue sapphire and white gold. Small enough for every day.' },
  { slug: 'chandbali-pearl-earrings', design: 'chandbali', name: 'Chandbali Pearl Earrings', cat: 'earrings', metal: 'yellow_gold', gem: 'pearl', purity: '22K', weight: 14, price: 168000, stock: 7, featured: true, rating: 4.9, reviews: 45,
    description: 'Crescent-moon chandbalis in filigree 22K gold, trimmed with seed pearls that move as you do.' },
  { slug: 'solitaire-diamond-studs', design: 'stud', name: 'Solitaire Diamond Studs', cat: 'earrings', metal: 'white_gold', gem: 'diamond', purity: '18K', weight: 2.2, carat: 0.6, price: 112000, stock: 15, rating: 4.9, reviews: 102,
    description: 'A matched pair of round brilliants in four-prong 18K white gold baskets with secure screw backs.' },
  { slug: 'ruby-jhumkas', design: 'jhumka', name: 'Ruby Jhumkas', cat: 'earrings', metal: 'yellow_gold', gem: 'ruby', purity: '22K', weight: 11, carat: 1.1, price: 139000, stock: 10, rating: 4.7, reviews: 52,
    description: 'Bell-shaped jhumkas in 22K gold with ruby-studded tops and tiny gold beads that chime softly.' },
  { slug: 'midnight-sapphire-drops', design: 'drop_earring', name: 'Midnight Sapphire Drops', cat: 'earrings', metal: 'platinum', gem: 'sapphire', purity: 'PT950', weight: 4.6, carat: 1.4, price: 154000, stock: 4, rating: 4.8, reviews: 18,
    description: 'Oval blue sapphires hanging from diamond-set platinum hooks. Quietly dramatic.' },
  { slug: 'diamond-tennis-bracelet', design: 'tennis', name: 'Diamond Tennis Bracelet', cat: 'bracelets', metal: 'white_gold', gem: 'diamond', purity: '18K', weight: 12, carat: 3.0, price: 398000, stock: 4, featured: true, rating: 4.9, reviews: 29,
    description: 'Fifty-two diamonds in a flexible line of 18K white gold, with a double safety clasp.' },
  { slug: 'rose-link-bracelet', design: 'link', name: 'Rose Link Bracelet', cat: 'bracelets', metal: 'rose_gold', gem: 'none', purity: '18K', weight: 9.5, price: 84000, stock: 17, rating: 4.6, reviews: 40,
    description: 'Softly rounded 18K rose gold links with a hidden box clasp.' },
  { slug: 'silver-charm-bracelet', design: 'charm', name: 'Silver Charm Bracelet', cat: 'bracelets', metal: 'silver', gem: 'none', purity: '925', weight: 14, price: 6900, compare: 7900, stock: 60, rating: 4.4, reviews: 230,
    description: 'Sterling silver with five charms, anti-tarnish finished. Add more charms any time.' },
  { slug: 'kangan-gold-bangle', design: 'kangan', name: 'Kangan Gold Bangle', cat: 'bangles', metal: 'yellow_gold', gem: 'none', purity: '22K', weight: 18, price: 214000, stock: 12, featured: true, rating: 4.8, reviews: 76,
    description: 'A hand-hammered 22K gold kangan with a subtle diamond-cut edge that catches light. Sold singly.' },
  { slug: 'polki-diamond-kada', design: 'kada', name: 'Polki Diamond Kada', cat: 'bangles', metal: 'yellow_gold', gem: 'diamond', purity: '22K', weight: 32, carat: 2.4, price: 512000, stock: 2, rating: 5.0, reviews: 9,
    description: 'Uncut polki diamonds set in 22K gold with traditional jadau work and a hinged opening.' },
  { slug: 'panna-studded-bangle', design: 'studded_bangle', name: 'Panna Studded Bangle', cat: 'bangles', metal: 'yellow_gold', gem: 'emerald', purity: '22K', weight: 21, carat: 1.6, price: 268000, stock: 6, rating: 4.7, reviews: 14,
    description: 'Round emeralds set at intervals around a 22K gold bangle.' },
  { slug: 'oxidised-silver-bangle', design: 'oxidised_bangle', name: 'Oxidised Silver Bangle', cat: 'bangles', metal: 'silver', gem: 'none', purity: '925', weight: 26, price: 5400, stock: 48, rating: 4.3, reviews: 145,
    description: 'Tribal-inspired motifs in oxidised sterling silver. Lightweight and made to be stacked.' },
]

// ---------------------------------------------------------------- people
type Staff = {
  key: string
  name: string
  email: string
  role: (typeof s.roleEnum.enumValues)[number]
  department: string
  title: string
  salary: number
  joinedDaysAgo: number
  manager?: string
  phone: string
}

const STAFF: Staff[] = [
  { key: 'owner', name: 'Ananya Rao', email: 'owner@sparkle.com', role: 'owner', department: 'Leadership', title: 'Founder & CEO', salary: 350000, joinedDaysAgo: 2200, phone: '9845000001' },
  { key: 'admin', name: 'Arjun Mehta', email: 'admin@sparkle.com', role: 'admin', department: 'Technology', title: 'Systems Administrator', salary: 140000, joinedDaysAgo: 1100, manager: 'owner', phone: '9845000002' },
  { key: 'manager', name: 'Kavya Iyer', email: 'manager@sparkle.com', role: 'manager', department: 'Store Operations', title: 'Operations Manager', salary: 120000, joinedDaysAgo: 1500, manager: 'owner', phone: '9845000003' },
  { key: 'hr', name: 'Rohan Shetty', email: 'hr@sparkle.com', role: 'hr', department: 'Human Resources', title: 'HR Lead', salary: 95000, joinedDaysAgo: 900, manager: 'owner', phone: '9845000004' },
  { key: 'employee', name: 'Isha Nair', email: 'employee@sparkle.com', role: 'employee', department: 'Sales', title: 'Jewellery Consultant', salary: 52000, joinedDaysAgo: 600, manager: 'manager', phone: '9845000005' },
  { key: 'vikram', name: 'Vikram Pai', email: 'vikram.pai@sparkle.com', role: 'employee', department: 'Store Operations', title: 'Inventory Executive', salary: 46000, joinedDaysAgo: 720, manager: 'manager', phone: '9845000006' },
  { key: 'meera', name: 'Meera Kamath', email: 'meera.kamath@sparkle.com', role: 'employee', department: 'Design', title: 'CAD Designer', salary: 68000, joinedDaysAgo: 410, manager: 'manager', phone: '9845000007' },
  { key: 'sameer', name: 'Sameer Khan', email: 'sameer.khan@sparkle.com', role: 'employee', department: 'Sales', title: 'Customer Care Associate', salary: 34000, joinedDaysAgo: 260, manager: 'manager', phone: '9845000008' },
  { key: 'divya', name: 'Divya Hegde', email: 'divya.hegde@sparkle.com', role: 'employee', department: 'Marketing', title: 'Content Marketer', salary: 58000, joinedDaysAgo: 9, manager: 'manager', phone: '9845000009' },
  { key: 'shareholder', name: 'Raghav Bhat', email: 'shareholder@sparkle.com', role: 'shareholder', department: 'Board', title: 'Investor & Board Member', salary: 0, joinedDaysAgo: 1800, phone: '9845000010' },
  { key: 'delivery', name: 'Suresh Kumar', email: 'delivery@sparkle.com', role: 'delivery_agent', department: 'Logistics', title: 'Delivery Partner', salary: 28000, joinedDaysAgo: 500, manager: 'manager', phone: '9845000011' },
  { key: 'delivery2', name: 'Manoj Poojary', email: 'delivery2@sparkle.com', role: 'delivery_agent', department: 'Logistics', title: 'Delivery Partner', salary: 28000, joinedDaysAgo: 340, manager: 'manager', phone: '9845000012' },
]

const CITIES = [
  ['Mangaluru', 'Karnataka', '575001'], ['Bengaluru', 'Karnataka', '560034'], ['Mysuru', 'Karnataka', '570009'],
  ['Udupi', 'Karnataka', '576101'], ['Mumbai', 'Maharashtra', '400050'], ['Pune', 'Maharashtra', '411004'],
  ['Chennai', 'Tamil Nadu', '600017'], ['Hyderabad', 'Telangana', '500034'], ['Kochi', 'Kerala', '682016'],
  ['New Delhi', 'Delhi', '110049'], ['Jaipur', 'Rajasthan', '302001'], ['Kolkata', 'West Bengal', '700019'],
  ['Ahmedabad', 'Gujarat', '380009'],
] as const

const CUSTOMER_NAMES = [
  'Priya Sharma', 'Aditya Kulkarni', 'Sneha Reddy', 'Karthik Subramanian', 'Neha Gupta', 'Rahul Desai', 'Lakshmi Menon',
  'Farhan Ali', 'Pooja Bhandary', 'Nikhil Joshi', 'Ritika Agarwal', 'Sanjay Rao', 'Anjali Patel', 'Deepak Shenoy',
  'Tanvi Mishra', 'Varun Chopra', 'Aisha Siddiqui', 'Gautam Hegde',
]

const STREETS = ['MG Road', 'Lady Hill', 'Indiranagar 100ft Rd', 'Bandra West', 'Koregaon Park', 'T Nagar', 'Banjara Hills', 'Panampilly Nagar', 'Hauz Khas', 'C-Scheme', 'Ballygunge', 'Navrangpura', 'Kadri', 'Jayalakshmipuram']

async function main() {
  const existing = await db.select({ id: s.users.id }).from(s.users).limit(1)
  if (existing.length) {
    console.log('Database already has data. Run `npm run db:reset` to start fresh.')
    await pool.end()
    return
  }

  console.log('Seeding Sparkle…')
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10)

  // categories + products
  const catRows = await db
    .insert(s.categories)
    .values(CATEGORIES.map((c, i) => ({ ...c, sort: i })))
    .returning()
  const catBySlug = Object.fromEntries(catRows.map((c) => [c.slug, c]))

  // stock = target + what the seeded orders will consume, so history lines up.
  const productRows = await db
    .insert(s.products)
    .values(
      PRODUCTS.map((p) => ({
        slug: p.slug,
        name: p.name,
        description: p.description,
        categoryId: catBySlug[p.cat].id,
        price: p.price,
        compareAtPrice: p.compare ?? null,
        jewelType: catBySlug[p.cat].jewelType,
        metal: p.metal,
        gem: p.gem,
        design: p.design,
        purity: p.purity,
        weightGrams: p.weight,
        caratWeight: p.carat ?? null,
        images: [1, 2, 3].map((n) => `/products/${p.slug}-${n}.webp`),
        stock: p.stock,
        lowStockThreshold: p.price > 300000 ? 2 : 5,
        rating: p.rating,
        reviewCount: p.reviews,
        featured: !!p.featured,
        certificateNo: p.gem === 'diamond' ? `IGI-${between(500000000, 599999999)}` : null,
      })),
    )
    .returning()

  // staff
  const staffRows = await db
    .insert(s.users)
    .values(
      STAFF.map((st) => ({
        name: st.name,
        email: st.email,
        phone: st.phone,
        passwordHash: hash,
        role: st.role,
        createdAt: daysAgo(st.joinedDaysAgo),
        lastLoginAt: daysAgo(between(0, 3)),
        lastLoginIp: `49.37.${between(1, 254)}.${between(1, 254)}`,
      })),
    )
    .returning()
  const staff = Object.fromEntries(STAFF.map((st, i) => [st.key, staffRows[i]]))
  await db.insert(s.employees).values(
    STAFF.map((st, i) => ({
      userId: staffRows[i].id,
      employeeCode: `SPK-E${String(101 + i)}`,
      department: st.department,
      title: st.title,
      managerId: st.manager ? staff[st.manager].id : null,
      joinDate: iso(daysAgo(st.joinedDaysAgo)),
      monthlySalary: st.salary,
      location: st.role === 'delivery_agent' ? 'Mangaluru' : pick(['Mangaluru', 'Bengaluru']),
    })),
  )

  // customers + addresses
  const customerRows = await db
    .insert(s.users)
    .values([
      { name: 'Demo Customer', email: 'customer@sparkle.com', phone: '9900000000', passwordHash: hash, role: 'customer' as const, createdAt: daysAgo(200) },
      ...CUSTOMER_NAMES.map((name, i) => ({
        name,
        email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
        phone: `98${String(45100000 + i * 7919).slice(0, 8)}`,
        passwordHash: hash,
        role: 'customer' as const,
        createdAt: daysAgo(between(30, 400)),
      })),
    ])
    .returning()
  const customerAddr = new Map<number, s.ShippingAddress>()
  const addrValues = customerRows.map((c, i) => {
    const [city, state, pincode] = i === 0 ? CITIES[0] : pick(CITIES)
    const addr = {
      userId: c.id,
      name: c.name,
      phone: c.phone ?? '9900000000',
      line1: `${between(1, 240)}, ${pick(STREETS)}`,
      line2: i % 3 === 0 ? `Flat ${between(101, 904)}` : null,
      city,
      state,
      pincode,
      isDefault: true,
    }
    customerAddr.set(c.id, addr)
    return addr
  })
  await db.insert(s.addresses).values(addrValues)

  // orders (most recent last). Popular products are picked more often.
  const weights = productRows.map((p) => (p.price < 50000 ? 6 : p.price < 150000 ? 4 : p.price < 300000 ? 2 : 1))
  const pickProduct = () => {
    const total = weights.reduce((a, b) => a + b, 0)
    let r = rand() * total
    for (let i = 0; i < productRows.length; i++) {
      r -= weights[i]
      if (r <= 0) return productRows[i]
    }
    return productRows[0]
  }
  const agents = [staff.delivery, staff.delivery2]
  const soldQty = new Map<number, number>()
  const movementRows: (typeof s.inventoryMovements.$inferInsert)[] = []
  let orderCount = 0

  for (let day = 180; day >= 0; day--) {
    // gentle growth over time plus a festive bump around Diwali-like peaks
    const base = 0.45 + (180 - day) / 260
    const festive = day > 60 && day < 85 ? 1.2 : 0
    // the last week has more in-flight orders so operations screens have live work
    const n = Math.floor(base + festive + rand() * 1.1) + (day <= 6 ? 2 : 0)
    for (let k = 0; k < n; k++) {
      const customer = day < 25 && rand() < 0.25 ? customerRows[0] : pick(customerRows)
      const lineCount = rand() < 0.75 ? 1 : rand() < 0.8 ? 2 : 3
      const lines = new Map<number, { p: (typeof productRows)[number]; q: number }>()
      for (let l = 0; l < lineCount; l++) {
        const p = pickProduct()
        const cur = lines.get(p.id)
        lines.set(p.id, { p, q: (cur?.q ?? 0) + (p.price < 10000 && rand() < 0.3 ? 2 : 1) })
      }
      const items = [...lines.values()]
      const totals = orderTotals(items.map((i) => ({ price: i.p.price, quantity: i.q })))
      const method = rand() < 0.65 ? 'razorpay' : 'cod'
      const createdAt = daysAgo(day)
      let status: (typeof s.orderStatusEnum.enumValues)[number]
      if (day > 6) status = rand() < 0.05 ? 'cancelled' : 'delivered'
      else if (day > 3) status = pick(['delivered', 'out_for_delivery', 'processing'] as const)
      else if (day > 0) status = pick(['processing', 'confirmed', 'out_for_delivery'] as const)
      else status = method === 'razorpay' && rand() < 0.3 ? 'pending_payment' : 'confirmed'
      const paid = method === 'razorpay' ? (status === 'pending_payment' ? 'pending' : status === 'cancelled' ? 'refunded' : 'paid') : status === 'delivered' ? 'paid' : 'pending'

      const [order] = await db
        .insert(s.orders)
        .values({
          number: 'TMP',
          userId: customer.id,
          status,
          paymentMethod: method,
          paymentStatus: paid,
          razorpayOrderId: method === 'razorpay' ? `order_seed${between(100000, 999999)}` : null,
          razorpayPaymentId: method === 'razorpay' && paid !== 'pending' ? `pay_seed${between(100000, 999999)}` : null,
          ...totals,
          shippingAddress: customerAddr.get(customer.id)!,
          stockCommitted: status !== 'pending_payment' && status !== 'cancelled',
          cancelReason: status === 'cancelled' ? pick(['Customer changed their mind', 'Ordered wrong size', 'Found a different design']) : null,
          createdAt,
          updatedAt: createdAt,
        })
        .returning()
      orderCount++
      const number = `SPK-${10000 + order.id}`
      await db.update(s.orders).set({ number }).where(sql`id = ${order.id}`)
      await db.insert(s.orderItems).values(
        items.map((i) => ({ orderId: order.id, productId: i.p.id, name: i.p.name, image: i.p.images[0], price: i.p.price, quantity: i.q })),
      )

      const events: (typeof s.orderEvents.$inferInsert)[] = [
        { orderId: order.id, status: 'placed', note: method === 'cod' ? 'Order placed (cash on delivery)' : 'Order placed', createdAt },
      ]
      const at = (h: number) => new Date(createdAt.getTime() + h * 3600_000)
      if (status !== 'pending_payment') {
        if (method === 'razorpay') events.push({ orderId: order.id, status: 'paid', note: 'Payment received via Razorpay', createdAt: at(0.05) })
        if (status !== 'cancelled') events.push({ orderId: order.id, status: 'confirmed', createdAt: at(0.1) })
      }
      if (status === 'cancelled') events.push({ orderId: order.id, status: 'cancelled', note: 'Cancelled by customer', createdAt: at(3) })
      if (['processing', 'out_for_delivery', 'delivered'].includes(status)) events.push({ orderId: order.id, status: 'processing', note: 'Packed and quality-checked', createdAt: at(18) })
      if (['out_for_delivery', 'delivered'].includes(status)) events.push({ orderId: order.id, status: 'out_for_delivery', createdAt: at(40) })
      if (status === 'delivered') events.push({ orderId: order.id, status: 'delivered', note: 'Delivered, OTP verified', createdAt: at(52) })
      await db.insert(s.orderEvents).values(events)

      if (status !== 'pending_payment' && status !== 'cancelled') {
        const agent = status === 'confirmed' ? null : status === 'processing' && rand() < 0.5 ? null : pick(agents)
        await db.insert(s.deliveries).values({
          orderId: order.id,
          agentId: agent?.id ?? null,
          status:
            status === 'delivered' ? 'delivered' : status === 'out_for_delivery' ? 'out_for_delivery' : agent ? 'assigned' : 'pending',
          otp: String(between(100000, 999999)),
          assignedAt: agent ? at(20) : null,
          deliveredAt: status === 'delivered' ? at(52) : null,
          updatedAt: status === 'delivered' ? at(52) : createdAt,
        })
        for (const i of items) {
          soldQty.set(i.p.id, (soldQty.get(i.p.id) ?? 0) + i.q)
          movementRows.push({ productId: i.p.id, change: -i.q, stockAfter: 0, reason: 'sale', orderId: order.id, note: number, createdAt })
        }
      }
    }
  }

  // inventory: opening stock 200 days ago, a restock mid-way, then sales. Compute running stock.
  const finalStock = new Map(productRows.map((p) => [p.id, p.stock]))
  const all: (typeof s.inventoryMovements.$inferInsert)[] = []
  for (const p of productRows) {
    const sold = soldQty.get(p.id) ?? 0
    // never let the running stock go below zero before the restock arrives
    const restock = Math.min(Math.max(1, Math.round(sold * 0.4)), p.stock)
    const opening = p.stock + sold - restock
    all.push({ productId: p.id, change: opening, stockAfter: 0, reason: 'restock', note: 'Opening stock', userId: staff.vikram.id, createdAt: daysAgo(200) })
    all.push({ productId: p.id, change: restock, stockAfter: 0, reason: 'restock', note: 'Workshop batch received', userId: staff.vikram.id, createdAt: daysAgo(between(60, 100)) })
  }
  all.push(...movementRows)
  all.sort((a, b) => +(a.createdAt as Date) - +(b.createdAt as Date))
  const running = new Map<number, number>()
  for (const m of all) {
    const v = (running.get(m.productId) ?? 0) + m.change
    running.set(m.productId, v)
    m.stockAfter = v
  }
  for (let i = 0; i < all.length; i += 500) await db.insert(s.inventoryMovements).values(all.slice(i, i + 500))
  for (const [id, v] of running) {
    if (v !== finalStock.get(id)) throw new Error(`Inventory mismatch for product ${id}: ${v} vs ${finalStock.get(id)}`)
  }

  // wishlist + a cart for the demo customer
  const demo = customerRows[0]
  await db.insert(s.wishlist).values([
    { userId: demo.id, productId: productRows[0].id },
    { userId: demo.id, productId: productRows[13].id },
  ])

  // tasks
  const T = (title: string, assignee: string, status: 'todo' | 'in_progress' | 'done', priority: 'low' | 'medium' | 'high', due: number, progress: number, description?: string) => ({
    title,
    description: description ?? null,
    assigneeId: staff[assignee].id,
    createdById: staff.manager.id,
    status,
    priority,
    progress,
    dueDate: iso(daysAgo(-due)),
    createdAt: daysAgo(between(3, 20)),
    completedAt: status === 'done' ? daysAgo(between(0, 2)) : null,
  })
  await db.insert(s.tasks).values([
    T('Photograph the new bridal collection', 'meera', 'in_progress', 'high', 3, 60, 'Front, side and on-model shots for all 12 bridal pieces.'),
    T('CAD render for custom Polki kada order', 'meera', 'todo', 'medium', 6, 0),
    T('Cycle count: diamond jewellery vault', 'vikram', 'in_progress', 'high', 1, 45, 'Count and reconcile every diamond SKU against the system.'),
    T('Reorder low-stock bangles', 'vikram', 'todo', 'medium', 4, 0),
    T('Call back customers with pending resizing', 'sameer', 'in_progress', 'medium', 2, 30),
    T('Update return policy FAQ', 'sameer', 'done', 'low', -1, 100),
    T('Prepare Akshaya Tritiya window display', 'employee', 'todo', 'high', 8, 0),
    T('Follow up on 5 bridal consultations', 'employee', 'in_progress', 'medium', 2, 40),
    T('Complete product knowledge training', 'employee', 'done', 'low', -3, 100),
    T('Write launch post for Rivière necklace', 'divya', 'todo', 'medium', 5, 0),
    T('Set up Instagram content calendar', 'divya', 'in_progress', 'low', 10, 20),
    T('Train new agent on OTP handover', 'delivery', 'done', 'medium', -2, 100),
  ])

  // leave requests
  const L = (who: string, type: 'casual' | 'sick' | 'earned' | 'unpaid', startOffset: number, len: number, status: 'pending' | 'approved' | 'rejected', reason: string) => {
    const start = iso(daysAgo(-startOffset))
    const endD = daysAgo(-startOffset - len + 1)
    const end = iso(endD)
    return {
      userId: staff[who].id,
      type,
      startDate: start,
      endDate: end,
      days: workingDays(start, end),
      reason,
      status,
      reviewerId: status === 'pending' ? null : staff.manager.id,
      reviewedAt: status === 'pending' ? null : daysAgo(Math.max(0, -startOffset + 2)),
      reviewNote: status === 'rejected' ? 'Peak season — can we move this by two weeks?' : null,
      createdAt: daysAgo(Math.max(1, -startOffset + 5)),
    }
  }
  await db.insert(s.leaveRequests).values([
    L('employee', 'casual', 6, 2, 'pending', 'Sister’s engagement in Udupi'),
    L('vikram', 'sick', -12, 2, 'approved', 'Fever'),
    L('meera', 'earned', 14, 5, 'pending', 'Family trip to Coorg'),
    L('sameer', 'casual', 3, 1, 'pending', 'Personal errand'),
    L('employee', 'sick', -40, 1, 'approved', 'Migraine'),
    L('vikram', 'earned', -70, 4, 'approved', 'Hometown visit'),
    L('meera', 'casual', -25, 1, 'rejected', 'Concert'),
    L('sameer', 'unpaid', -35, 2, 'approved', 'Extended travel'),
    L('delivery', 'casual', -18, 1, 'approved', 'Bank work'),
  ])

  // payroll: last three full months, processed
  const now = new Date()
  const approvedUnpaid = await db.select().from(s.leaveRequests)
  for (let m = 3; m >= 1; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const daysIn = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    const eligible = STAFF.filter((st) => st.salary > 0 && st.joinedDaysAgo > m * 31)
    const slips = eligible.map((st) => {
      const u = staff[st.key]
      const unpaid = approvedUnpaid
        .filter((l) => l.userId === u.id && l.type === 'unpaid' && l.status === 'approved')
        .reduce((sum, l) => sum + daysInMonthOverlap(l.startDate, l.endDate, ym), 0)
      return { userId: u.id, ...calculatePayslip(st.salary, unpaid, daysIn) }
    })
    const [run] = await db
      .insert(s.payrollRuns)
      .values({
        month: ym,
        status: 'processed',
        totalGross: slips.reduce((a, b) => a + b.gross, 0),
        totalNet: slips.reduce((a, b) => a + b.net, 0),
        processedById: staff.hr.id,
        processedAt: new Date(d.getFullYear(), d.getMonth() + 1, 0, 18),
        createdAt: new Date(d.getFullYear(), d.getMonth() + 1, 0, 10),
      })
      .returning()
    await db.insert(s.payslips).values(slips.map((sl) => ({ ...sl, runId: run.id })))
  }

  // onboarding for the newest hire
  const steps = ['Sign offer letter and NDA', 'Submit ID and bank details', 'Laptop and email set up', 'Store safety and vault training', 'Meet the design team', 'Shadow a bridal consultation', '30-day check-in with manager']
  await db.insert(s.onboardingTasks).values(
    steps.map((title, i) => ({ userId: staff.divya.id, title, sort: i, done: i < 3, completedAt: i < 3 ? daysAgo(8 - i) : null, dueDate: iso(daysAgo(-(i * 4) + 8)) })),
  )

  await db.insert(s.announcements).values([
    { title: 'Diwali collection launch', body: 'Our festive collection goes live on the website on Friday. Store teams: please review the new pieces in the vault before then.', authorId: staff.owner.id, pinned: true, createdAt: daysAgo(4) },
    { title: 'New leave policy', body: 'Earned leave allowance increases from 12 to 15 days from this year. See the Leave Policy for details.', authorId: staff.hr.id, createdAt: daysAgo(12) },
    { title: 'Welcome Divya!', body: 'Divya Hegde joins our marketing team as Content Marketer. Say hello!', authorId: staff.hr.id, createdAt: daysAgo(9) },
  ])
  await db.insert(s.policies).values([
    { title: 'Leave policy', category: 'Time off', body: 'Every employee receives 12 casual, 10 sick and 15 earned leave days per calendar year. Leave is requested in the employee portal and approved by your manager. Unpaid leave is available on approval and is deducted pro-rata in payroll. Sundays are not counted.' },
    { title: 'Code of conduct', category: 'Conduct', body: 'Treat every customer and colleague with respect. Never share customer details outside the company. Report any gift or payment from suppliers to HR.' },
    { title: 'Vault & security procedure', category: 'Operations', body: 'The vault is opened by two authorised staff together. Every piece taken out for display or a customer is logged in inventory. Daily counts are reconciled by the inventory executive before closing.' },
    { title: 'Payroll & reimbursements', category: 'Payroll', body: 'Salaries are processed on the last working day of the month. Payslips are available in the HR portal. Reimbursement claims must be submitted with receipts within 30 days.' },
  ])

  // recruiting
  const jobRows = await db
    .insert(s.jobs)
    .values([
      { slug: 'senior-jewellery-designer', title: 'Senior Jewellery Designer', department: 'Design', location: 'Mangaluru', type: 'full_time', description: 'Lead design for our bridal and high-jewellery lines, from hand sketches to CAD-ready drawings, working closely with our karigars.', requirements: ['5+ years designing fine jewellery', 'Strong hand-sketching and Rhino/Matrix CAD', 'Understanding of stone setting and casting', 'A portfolio we can see'] },
      { slug: 'retail-jewellery-consultant', title: 'Retail Jewellery Consultant', department: 'Sales', location: 'Bengaluru', type: 'full_time', description: 'Guide customers through one of the biggest purchases of their lives. You will run consultations, manage appointments and follow up after the sale.', requirements: ['2+ years in luxury retail', 'Fluent English and Kannada; Hindi is a plus', 'Comfort with high-value transactions'] },
      { slug: 'digital-marketing-associate', title: 'Digital Marketing Associate', department: 'Marketing', location: 'Remote (India)', type: 'full_time', description: 'Plan and run our performance campaigns and email programme, and report on what is working.', requirements: ['2+ years running Meta and Google campaigns', 'Comfortable with analytics', 'Great written English'] },
      { slug: 'gemology-intern', title: 'Gemology Intern', department: 'Quality', location: 'Mangaluru', type: 'internship', description: 'A six-month internship grading and documenting coloured stones and diamonds alongside our quality lead.', requirements: ['Pursuing or completed a gemology diploma (GIA/IGI)', 'Attention to detail'] },
      { slug: 'delivery-partner', title: 'Delivery Partner', department: 'Logistics', location: 'Mangaluru', type: 'contract', description: 'Deliver insured parcels across Dakshina Kannada and Udupi with our secure OTP handover process.', requirements: ['Two-wheeler and valid licence', 'Smartphone', 'Clean background check'] },
    ])
    .returning()
  const applicants = [
    ['Nandini Prabhu', 0, 'interview'], ['Harish Gowda', 0, 'reviewing'], ['Zoya Sheikh', 0, 'new'], ['Ajay Menon', 1, 'offer'],
    ['Shruti Kini', 1, 'new'], ['Rakesh Naik', 1, 'rejected'], ['Fatima Begum', 2, 'reviewing'], ['Kiran D’Souza', 2, 'new'],
    ['Pranav Acharya', 3, 'interview'], ['Ramesh Shetty', 4, 'hired'], ['Anil Salian', 4, 'new'],
  ] as const
  await db.insert(s.applications).values(
    applicants.map(([name, job, status], i) => ({
      jobId: jobRows[job].id,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
      phone: `97${String(41000000 + i * 1237)}`,
      portfolioUrl: job === 0 ? `https://behance.net/${name.split(' ')[0].toLowerCase()}` : null,
      coverLetter: `Hello, I'd love to join Sparkle as ${jobRows[job].title}. I've followed your work for years and believe my experience would be a good fit.`,
      status,
      createdAt: daysAgo(between(1, 30)),
    })),
  )

  // audit trail
  const audits: (typeof s.auditLogs.$inferInsert)[] = []
  for (const st of STAFF.slice(0, 5)) {
    for (let i = 0; i < 4; i++) audits.push({ userId: staff[st.key].id, actorEmail: st.email, action: 'auth.login', ip: `49.37.${between(1, 254)}.${between(1, 254)}`, success: true, createdAt: daysAgo(between(0, 14)) })
  }
  audits.push(
    { actorEmail: 'admin@sparkle.com', action: 'auth.login', details: 'Wrong password', ip: '185.220.101.4', success: false, createdAt: daysAgo(2, 3) },
    { actorEmail: 'admin@sparkle.com', action: 'auth.login', details: 'Wrong password', ip: '185.220.101.4', success: false, createdAt: daysAgo(2, 3) },
    { actorEmail: 'owner@sparkle.com', action: 'auth.login', details: 'Wrong password', ip: '103.21.58.9', success: false, createdAt: daysAgo(1, 23) },
    { userId: staff.vikram.id, actorEmail: staff.vikram.email, action: 'inventory.adjust', entity: 'product', entityId: String(productRows[16].id), details: 'Restocked 3 units', ip: '49.37.12.80', createdAt: daysAgo(5) },
    { userId: staff.manager.id, actorEmail: staff.manager.email, action: 'leave.approve', entity: 'leave', details: 'Approved sick leave for Vikram Pai', ip: '49.37.12.81', createdAt: daysAgo(10) },
    { userId: staff.owner.id, actorEmail: staff.owner.email, action: 'user.role_change', entity: 'user', entityId: String(staff.admin.id), details: 'admin → admin (confirmed)', ip: '49.37.12.2', createdAt: daysAgo(30) },
  )
  await db.insert(s.auditLogs).values(audits)

  await db.insert(s.settings).values([
    { key: 'maintenance', value: { enabled: false, message: 'We are polishing things up. Back shortly!' } },
    { key: 'store', value: { name: 'Sparkle', email: 'hello@sparkle.com', phone: '+91 824 240 0000', address: 'Lighthouse Hill Road, Mangaluru 575001' } },
  ])
  await db.insert(s.subscribers).values([{ email: 'priya.sharma@example.com' }, { email: 'karthik.subramanian@example.com' }])

  console.log(`Seeded ${productRows.length} products, ${staffRows.length} staff, ${customerRows.length} customers, ${orderCount} orders.`)
  console.log(`All demo accounts use the password: ${DEMO_PASSWORD}`)
  await pool.end()
}

main().catch(async (e) => {
  console.error(e)
  await pool.end()
  process.exit(1)
})
