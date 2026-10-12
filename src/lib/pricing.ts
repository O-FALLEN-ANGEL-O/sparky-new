/** GST on gold, silver and diamond jewellery in India is 3%. Prices are whole rupees. */
export const GST_RATE = 0.03
export const FREE_SHIPPING = true

export function orderTotals(lines: { price: number; quantity: number }[]) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
  const tax = Math.round(subtotal * GST_RATE)
  const shipping = 0
  return { subtotal, tax, shipping, total: subtotal + tax + shipping }
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
export const formatINR = (n: number) => inr.format(n)

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })
export const formatCompactINR = (n: number) => `₹${compact.format(n)}`
