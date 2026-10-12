/**
 * End-to-end tests against a running Sparkle (npm run dev) with a freshly seeded database.
 *
 *   npm run db:reset && npm run dev     (in another terminal)
 *   CHROME=/path/to/chrome npm run test:e2e
 *
 * Needs RAZORPAY_WEBHOOK_SECRET=test_webhook_secret in .env.local for the webhook test.
 */
import { createHmac } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import pg from 'pg'
import { chromium } from 'playwright-core'

for (const f of ['.env.local', '.env']) {
  if (!existsSync(f)) continue
  for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const BASE = process.env.BASE ?? 'http://localhost:9002'
const PASSWORD = 'Sparkle@123'
const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
await db.connect()
const q = async (sql, params = []) => (await db.query(sql, params)).rows

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined })
let passed = 0
const failed = []
const check = (name, cond, info = '') => {
  if (cond) {
    passed++
    console.log(`  ok   ${name}`)
  } else {
    failed.push(name)
    console.log(`  FAIL ${name} ${info}`)
  }
}

async function session(email, password = PASSWORD) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('    pageerror:', e.message.slice(0, 160)))
  if (email) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
    await page.fill('input[name=email]', email)
    await page.fill('input[name=password]', password)
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 60000 }), page.click('button[type=submit]')])
  }
  return { ctx, page }
}

const go = (page, path) => page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 120000 })

// --------------------------------------------------------------------------
console.log('\naccess control')
{
  const { ctx, page } = await session()
  await go(page, '/dashboard')
  check('signed-out /dashboard → login', new URL(page.url()).pathname === '/login')
  await go(page, '/checkout')
  check('signed-out /checkout → login with next', page.url().includes('next=%2Fcheckout'))
  await ctx.close()
}
{
  const { ctx, page } = await session('customer@sparkle.com')
  await go(page, '/dashboard')
  check('customer kept out of staff dashboard', new URL(page.url()).pathname === '/account')
  await ctx.close()
}
{
  const { ctx, page } = await session('employee@sparkle.com')
  await go(page, '/dashboard/payroll')
  check('employee cannot open payroll', new URL(page.url()).pathname === '/forbidden')
  const res = await page.goto(`${BASE}/dashboard/reports/download/payroll`)
  check('employee cannot download payroll CSV', res.status() === 403)
  await ctx.close()
}
{
  const { ctx, page } = await session('shareholder@sparkle.com')
  await go(page, '/dashboard/orders')
  check('shareholder cannot see orders', new URL(page.url()).pathname === '/forbidden')
  await ctx.close()
}

// --------------------------------------------------------------------------
console.log('\nlogin protection')
{
  const email = 'hr@sparkle.com'
  await q(`delete from audit_logs where action = 'auth.login' and success = false and actor_email = $1`, [email])
  const { ctx, page } = await session()
  for (let i = 0; i < 5; i++) {
    await go(page, '/login')
    await page.fill('input[name=email]', email)
    await page.fill('input[name=password]', 'wrong-password')
    await page.click('button[type=submit]')
    await page.waitForSelector('main [role=alert]')
  }
  await go(page, '/login')
  await page.fill('input[name=email]', email)
  await page.fill('input[name=password]', PASSWORD)
  await page.click('button[type=submit]')
  await page.waitForSelector('main [role=alert]')
  check('correct password refused after 5 failures', (await page.textContent('main [role=alert]')).includes('Too many'))
  await q(`delete from audit_logs where action = 'auth.login' and success = false and actor_email = $1`, [email])
  await ctx.close()
}

// --------------------------------------------------------------------------
console.log('\nshopping: guest bag → register → checkout (cash on delivery)')
const slug = 'heartline-diamond-pendant'
const [before] = await q('select id, stock, price from products where slug = $1', [slug])
const email = `test${Date.now()}@example.com`
let orderNumber
{
  const { ctx, page } = await session()
  await go(page, '/shop?category=pendants&metal=rose_gold')
  check('shop filters to rose gold pendants', (await page.locator('article').count()) >= 1)
  await go(page, `/products/${slug}`)
  check('product page shows price', (await page.textContent('main')).includes('42,500'))
  await page.click('button[aria-label="Increase quantity"]')
  await page.click('button:has-text("Add to bag")')
  await page.waitForSelector('text=Added to your bag')
  await go(page, '/cart')
  check('guest bag holds 2 pieces', (await page.textContent('main')).includes('₹85,000'))
  await go(page, '/checkout')
  check('checkout asks guest to sign in', new URL(page.url()).pathname === '/login')
  await go(page, '/register?next=/checkout')
  await page.fill('input[name=name]', 'Test Buyer')
  await page.fill('input[name=email]', email)
  await page.fill('input[name=phone]', '9876543210')
  await page.fill('input[name=password]', 'Testing123')
  await Promise.all([page.waitForURL((u) => u.pathname === '/checkout', { timeout: 60000 }), page.click('button[type=submit]')])
  check('registration lands on checkout with bag kept', (await page.textContent('main')).includes('Qty 2'))
  await page.fill('input[name=line1]', '12, Kadri Hills')
  await page.fill('input[name=city]', 'Mangaluru')
  await page.fill('input[name=pincode]', '575004')
  await page.check('input[value=cod]')
  await Promise.all([page.waitForURL((u) => u.pathname.startsWith('/account/orders/'), { timeout: 60000 }), page.click('button[type=submit]')])
  orderNumber = new URL(page.url()).pathname.split('/').pop()
  check('order placed and confirmed', (await page.textContent('main')).includes('your order is confirmed'), orderNumber)
  const [after] = await q('select stock from products where id = $1', [before.id])
  check('stock reduced by 2', after.stock === before.stock - 2, `${before.stock} → ${after.stock}`)
  const [o] = await q('select total, tax, subtotal from orders where number = $1', [orderNumber])
  check('GST is 3%', o.tax === Math.round(o.subtotal * 0.03) && o.total === o.subtotal + o.tax)
  const [{ n }] = await q('select count(*)::int n from cart_items c join users u on u.id = c.user_id where u.email = $1', [email])
  check('bag emptied after ordering', n === 0)
  await ctx.close()
}

// --------------------------------------------------------------------------
console.log('\nfulfilment: manager prepares and assigns → partner delivers with code')
{
  const { ctx, page } = await session('manager@sparkle.com')
  await go(page, `/dashboard/orders/${orderNumber}`)
  await page.click('button:has-text("Start preparing")')
  await page.waitForSelector('text=Marked as being prepared')
  const [agent] = await q(`select id from users where email = 'delivery@sparkle.com'`)
  await page.selectOption('#agent', String(agent.id))
  await page.click('button:has-text("Assign")')
  await page.waitForSelector('text=Partner assigned')
  const [d] = await q('select d.status, d.agent_id from deliveries d join orders o on o.id = d.order_id where o.number = $1', [orderNumber])
  check('delivery assigned to partner', d.status === 'assigned' && d.agent_id === agent.id)
  await ctx.close()
}
{
  const { ctx, page } = await session('delivery@sparkle.com')
  const [d] = await q('select d.id, d.otp from deliveries d join orders o on o.id = d.order_id where o.number = $1', [orderNumber])
  await go(page, `/delivery/${d.id}`)
  await page.click('button:has-text("Accept this delivery")')
  await page.waitForSelector('button:has-text("start delivery")')
  await page.click('button:has-text("start delivery")')
  await page.waitForSelector('#otp')
  const [o1] = await q('select status from orders where number = $1', [orderNumber])
  check('order shows out for delivery', o1.status === 'out_for_delivery')
  const wrong = d.otp === '111111' ? '222222' : '111111'
  await page.fill('#otp', wrong)
  await page.click('button:has-text("Confirm delivery")')
  await page.waitForSelector('main [role=alert]')
  check('wrong code rejected', (await page.textContent('main [role=alert]')).includes('wrong'))
  await page.fill('#otp', d.otp)
  await page.click('button:has-text("Confirm delivery")')
  await page.waitForSelector('main [role=status]')
  const [o2] = await q('select status, payment_status from orders where number = $1', [orderNumber])
  check('correct code completes delivery and marks cash paid', o2.status === 'delivered' && o2.payment_status === 'paid')
  await go(page, '/delivery')
  const toDo = await page.locator('main ul').first().textContent()
  check('delivered parcel leaves the partner’s to-do list', !toDo.includes(orderNumber))
  await ctx.close()
}
{
  const { ctx, page } = await session(email, 'Testing123')
  await go(page, `/account/orders/${orderNumber}`)
  check('customer sees delivered timeline', (await page.textContent('main')).includes('Delivered'))
  await ctx.close()
}

// --------------------------------------------------------------------------
console.log('\ncustomer cancellation returns stock')
{
  const { ctx, page } = await session('customer@sparkle.com')
  await go(page, '/products/om-gold-pendant')
  const [p] = await q(`select id, stock from products where slug = 'om-gold-pendant'`)
  await page.click('button:has-text("Add to bag")')
  await page.waitForSelector('text=Added to your bag')
  await go(page, '/checkout')
  const radios = page.locator('input[name=addressId]')
  if (await radios.count()) await radios.first().check()
  await page.check('input[value=cod]')
  await Promise.all([page.waitForURL((u) => u.pathname.startsWith('/account/orders/'), { timeout: 60000 }), page.click('button[type=submit]')])
  const num = new URL(page.url()).pathname.split('/').pop()
  await page.click('button:has-text("Cancel order")')
  await page.click('button:has-text("Yes, cancel it")')
  await page.waitForTimeout(1500)
  const [o] = await q('select status from orders where number = $1', [num])
  const [after] = await q('select stock from products where id = $1', [p.id])
  check('order cancelled', o.status === 'cancelled')
  check('stock restored after cancellation', after.stock === p.stock, `${p.stock} vs ${after.stock}`)
  await ctx.close()
}

// --------------------------------------------------------------------------
console.log('\nRazorpay')
{
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  const [u] = await q(`select id from users where email = 'customer@sparkle.com'`)
  const [p] = await q(`select id, name, price, stock from products where slug = 'classic-gold-band'`)
  const [o] = await q(
    `insert into orders (number, user_id, status, payment_method, payment_status, razorpay_order_id, subtotal, tax, total, shipping_address)
     values ($1, $2, 'pending_payment', 'razorpay', 'pending', 'order_TEST123', $3, $4, $5, $6) returning id`,
    [`TEST-${Date.now()}`, u.id, p.price, Math.round(p.price * 0.03), p.price + Math.round(p.price * 0.03), JSON.stringify({ name: 'T', phone: '9999999999', line1: 'x', city: 'Mangaluru', state: 'Karnataka', pincode: '575001' })],
  )
  await q(`insert into order_items (order_id, product_id, name, price, quantity) values ($1, $2, $3, $4, 1)`, [o.id, p.id, p.name, p.price])
  const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_TEST456', order_id: 'order_TEST123' } } } })
  const bad = await fetch(`${BASE}/api/razorpay/webhook`, { method: 'POST', headers: { 'x-razorpay-signature': 'a'.repeat(64) }, body })
  check('webhook rejects a bad signature', bad.status === 401)
  if (secret) {
    const sig = createHmac('sha256', secret).update(body).digest('hex')
    const ok = await fetch(`${BASE}/api/razorpay/webhook`, { method: 'POST', headers: { 'x-razorpay-signature': sig }, body })
    const again = await fetch(`${BASE}/api/razorpay/webhook`, { method: 'POST', headers: { 'x-razorpay-signature': sig }, body })
    const [after] = await q('select status, payment_status, razorpay_payment_id from orders where id = $1', [o.id])
    const [stock] = await q('select stock from products where id = $1', [p.id])
    check('signed webhook confirms the order', ok.status === 200 && after.status === 'confirmed' && after.payment_status === 'paid')
    check('replayed webhook takes stock only once', again.status === 200 && stock.stock === p.stock - 1, `${p.stock} → ${stock.stock}`)
    const [{ n }] = await q('select count(*)::int n from deliveries where order_id = $1', [o.id])
    check('paid order gets a delivery', n === 1)
  } else {
    console.log('  skip signed webhook (set RAZORPAY_WEBHOOK_SECRET)')
  }
}

// --------------------------------------------------------------------------
console.log('\npeople: leave, tasks, payroll, hiring')
{
  const { ctx, page } = await session('employee@sparkle.com')
  await q(`delete from leave_requests where reason = 'E2E test leave'`)
  await go(page, '/dashboard/leave?new=1')
  const start = new Date(Date.now() + 40 * 86400000)
  while (start.getDay() === 0) start.setDate(start.getDate() + 1)
  const iso = start.toISOString().slice(0, 10)
  await page.fill('input[name=startDate]', iso)
  await page.fill('input[name=endDate]', iso)
  await page.fill('input[name=reason]', 'E2E test leave')
  await page.click('button:has-text("Send request")')
  await page.waitForSelector('text=Request sent')
  check('employee requests leave', (await q(`select status from leave_requests where reason = 'E2E test leave'`))[0]?.status === 'pending')
  await ctx.close()
}
{
  const { ctx, page } = await session('manager@sparkle.com')
  await go(page, '/dashboard/leave')
  const item = page.locator('li', { hasText: 'E2E test leave' })
  await item.locator('button:has-text("Approve")').click()
  await page.waitForTimeout(1500)
  check('manager approves leave', (await q(`select status from leave_requests where reason = 'E2E test leave'`))[0]?.status === 'approved')
  await go(page, '/dashboard/tasks?new=1')
  await page.fill('input[name=title]', 'E2E polish display trays')
  await page.click('button:has-text("Assign")')
  await page.waitForSelector('text=Task assigned')
  check('manager assigns a task', (await q(`select count(*)::int n from tasks where title = 'E2E polish display trays'`))[0].n === 1)
  await ctx.close()
}
{
  const { ctx, page } = await session('hr@sparkle.com')
  const month = new Date().toISOString().slice(0, 7)
  await q(`delete from payroll_runs where month = $1`, [month])
  await go(page, '/dashboard/payroll')
  await page.fill('input[type=month]', month)
  await page.click('button:has-text("Prepare draft")')
  await page.waitForSelector('text=Draft ready')
  await page.waitForSelector('button:has-text("Process payroll")')
  await page.click('button:has-text("Process payroll")')
  await page.click('button:has-text("Yes")')
  await page.waitForTimeout(2000)
  const [run] = await q('select status, total_net from payroll_runs where month = $1', [month])
  check('HR prepares and processes payroll', run?.status === 'processed' && run.total_net > 0)
  const csv = await page.request.get(`${BASE}/dashboard/reports/download/payroll?from=${month}-01&to=${month}-28`)
  const text = await csv.text()
  check('payroll CSV downloads with rows', csv.status() === 200 && text.split('\n').length > 3 && text.includes('Net pay'))

  const newEmail = `newhire${Date.now()}@sparkle.com`
  await go(page, '/dashboard/people')
  await page.click('button:has-text("Add a person")')
  await page.fill('input[name=name]', 'New Hire')
  await page.fill('input[name=email]', newEmail)
  await page.fill('input[name=phone]', '9123456780')
  await page.fill('input[name=department]', 'Sales')
  await page.fill('input[name=title]', 'Consultant')
  await page.fill('input[name=monthlySalary]', '40000')
  await page.click('button:has-text("Add and start onboarding")')
  await page.waitForSelector('text=temporary password')
  const temp = (await page.textContent('main [role=status]')).match(/Sparkle-[a-z0-9]+/)?.[0]
  const [{ n }] = await q(`select count(*)::int n from onboarding_tasks t join users u on u.id = t.user_id where u.email = $1`, [newEmail])
  check('HR adds a person with an onboarding checklist', !!temp && n === 7)
  await ctx.close()
  const hire = await session(newEmail, temp)
  check('new hire signs in with temporary password', new URL(hire.page.url()).pathname === '/dashboard')
  await hire.ctx.close()
}
{
  const { ctx, page } = await session('employee@sparkle.com')
  await go(page, '/dashboard/portal')
  check('employee sees this month’s payslip', (await page.textContent('#main')).includes(new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })))
  await ctx.close()
}
{
  const { ctx, page } = await session()
  const [job] = await q(`select id, slug from jobs where open limit 1`)
  await go(page, `/careers/${job.slug}`)
  await page.fill('input[name=name]', 'E2E Applicant')
  await page.fill('input[name=email]', 'e2e.applicant@example.com')
  await page.fill('input[name=phone]', '9988776655')
  await page.fill('textarea[name=coverLetter]', 'I have five years of experience and would love to join the Sparkle atelier team in Mangaluru.')
  await page.click('button:has-text("Send application")')
  await page.waitForSelector('text=Our team reads every application')
  check('public job application lands in recruitment', (await q(`select count(*)::int n from applications where email = 'e2e.applicant@example.com'`))[0].n >= 1)
  await ctx.close()
}

// --------------------------------------------------------------------------
console.log('\nowner: maintenance mode and stock')
{
  const { ctx, page } = await session('owner@sparkle.com')
  await go(page, '/dashboard/settings')
  await page.check('input[name=enabled]')
  await page.click('button:has-text("Save"):not(:has-text("details")):not(:has-text("profile"))')
  await page.waitForSelector('text=Checkout is paused')
  const shopper = await session('customer@sparkle.com')
  await go(shopper.page, '/')
  check('maintenance banner shows on store', (await shopper.page.textContent('body')).includes('Checkout is paused'))
  await shopper.ctx.close()
  await go(page, '/dashboard/settings')
  await page.uncheck('input[name=enabled]')
  await page.click('button:has-text("Save"):not(:has-text("details")):not(:has-text("profile"))')
  await page.waitForSelector('text=Checkout is open again')
  check('maintenance can be switched off', true)

  const [p] = await q(`select id, stock from products where slug = 'polki-diamond-kada'`)
  await go(page, `/dashboard/inventory?product=${p.id}`)
  await page.fill('input[name=change]', '3')
  await page.fill('input[name=note]', 'E2E workshop batch')
  await page.click('button:has-text("Update stock")')
  await page.waitForSelector('text=Stock updated')
  const [after] = await q('select stock from products where id = $1', [p.id])
  check('owner restocks a piece', after.stock === p.stock + 3)
  const [{ n }] = await q(`select count(*)::int n from audit_logs where action = 'inventory.adjust' and details like '%E2E workshop batch%'`)
  check('stock change is in the audit log', n === 1)
  await ctx.close()
}

await browser.close()
await db.end()
console.log(`\n${passed} passed, ${failed.length} failed`)
if (failed.length) {
  console.log('failed:', failed.join('; '))
  process.exit(1)
}
