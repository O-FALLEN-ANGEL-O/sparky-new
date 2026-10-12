/** Unit checks for money logic. Run: npm run test:unit */
import { createHmac } from 'node:crypto'
import { daysInMonthOverlap, workingDays } from '../src/lib/leave'
import { annualTax, calculatePayslip } from '../src/lib/payroll'
import { orderTotals } from '../src/lib/pricing'

let failed = 0
const eq = (name: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failed++
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` — got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`}`)
}

console.log('pricing')
eq('3% GST rounded to the rupee', orderTotals([{ price: 42500, quantity: 2 }]), { subtotal: 85000, tax: 2550, shipping: 0, total: 87550 })
eq('GST rounding', orderTotals([{ price: 6900, quantity: 1 }]).tax, 207)

console.log('income tax (new regime FY 2025-26)')
eq('no tax up to ₹12.75L gross (rebate + standard deduction)', annualTax(1_275_000), 0)
eq('₹18L gross', annualTax(1_800_000), Math.round((20000 + 40000 + 60000 + 25000) * 1.04))
eq('₹42L gross', annualTax(4_200_000), Math.round((20000 + 40000 + 60000 + 80000 + 100000 + (4_125_000 - 2_400_000) * 0.3) * 1.04))

console.log('payslip')
const p = calculatePayslip(52000)
eq('structure adds up', p.basic + p.hra + p.allowances, 52000)
eq('PF capped at ₹1,800', p.pf, 1800)
eq('professional tax ₹200', p.professionalTax, 200)
eq('no TDS under rebate', p.tds, 0)
eq('net', p.net, 52000 - 1800 - 200)
eq('unpaid leave deduction pro-rata', calculatePayslip(30000, 2, 30).unpaidLeaveDeduction, 2000)
eq('small salary has no professional tax', calculatePayslip(20000).professionalTax, 0)

console.log('leave')
eq('Mon–Sat is 6 working days', workingDays('2026-10-12', '2026-10-17'), 6)
eq('Sunday not counted', workingDays('2026-10-17', '2026-10-19'), 2)
eq('month overlap', daysInMonthOverlap('2026-09-28', '2026-10-03', '2026-10'), 3)

console.log('razorpay signatures')
process.env.RAZORPAY_KEY_SECRET = 'secret_key'
const { verifyPaymentSignature, verifyWebhookSignature } = await import('../src/lib/server/razorpay')
const good = createHmac('sha256', 'secret_key').update('order_1|pay_1').digest('hex')
eq('valid checkout signature accepted', verifyPaymentSignature('order_1', 'pay_1', good), true)
eq('tampered payment id rejected', verifyPaymentSignature('order_1', 'pay_2', good), false)
eq('garbage signature rejected', verifyPaymentSignature('order_1', 'pay_1', 'nope'), false)
const body = '{"a":1}'
eq('valid webhook accepted', verifyWebhookSignature(body, createHmac('sha256', 'wh').update(body).digest('hex'), 'wh'), true)
eq('webhook without secret rejected', verifyWebhookSignature(body, createHmac('sha256', 'wh').update(body).digest('hex'), ''), false)

console.log('passwords (PBKDF2)')
const { hashPassword, verifyPassword } = await import('../src/lib/password')
const h1 = await hashPassword('Sparkle@123')
eq('hash has scheme, iterations, salt and digest', h1.split('$').length === 4 && h1.startsWith('pbkdf2$100000$'), true)
eq('right password verifies', await verifyPassword('Sparkle@123', h1), true)
eq('wrong password refused', await verifyPassword('sparkle@123', h1), false)
eq('same password gets a fresh salt', (await hashPassword('Sparkle@123')) === h1, false)
eq('unknown hash format refused', await verifyPassword('x', '$2b$10$abcdefghijklmnopqrstuv'), false)

console.log(failed ? `\n${failed} failed` : '\nall passed')
process.exit(failed ? 1 : 0)
