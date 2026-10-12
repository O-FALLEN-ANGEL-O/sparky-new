/**
 * Indian payroll estimate (new tax regime, FY 2025-26).
 * Salary structure: basic 50%, HRA 20%, allowances 30% of gross.
 * PF: 12% of basic, capped at ₹1,800 (₹15,000 wage ceiling).
 * Professional tax (Karnataka): ₹200 when gross ≥ ₹25,000.
 * TDS: annual slab tax after ₹75,000 standard deduction, 87A rebate up to ₹12L, plus 4% cess, spread monthly.
 */
export interface PayslipCalc {
  basic: number
  hra: number
  allowances: number
  gross: number
  pf: number
  professionalTax: number
  tds: number
  unpaidLeaveDeduction: number
  net: number
}

const SLABS: [number, number][] = [
  [400_000, 0],
  [800_000, 0.05],
  [1_200_000, 0.1],
  [1_600_000, 0.15],
  [2_000_000, 0.2],
  [2_400_000, 0.25],
  [Infinity, 0.3],
]

export function annualTax(annualGross: number): number {
  const taxable = Math.max(0, annualGross - 75_000)
  if (taxable <= 1_200_000) return 0 // section 87A rebate
  let tax = 0
  let lower = 0
  for (const [upper, rate] of SLABS) {
    if (taxable > lower) tax += (Math.min(taxable, upper) - lower) * rate
    lower = upper
  }
  return Math.round(tax * 1.04)
}

export function calculatePayslip(monthlySalary: number, unpaidLeaveDays = 0, daysInMonth = 30): PayslipCalc {
  const gross = Math.round(monthlySalary)
  const basic = Math.round(gross * 0.5)
  const hra = Math.round(gross * 0.2)
  const allowances = gross - basic - hra
  const pf = Math.min(Math.round(basic * 0.12), 1800)
  const professionalTax = gross >= 25_000 ? 200 : 0
  const tds = Math.round(annualTax(gross * 12) / 12)
  const unpaidLeaveDeduction = Math.round((gross / daysInMonth) * unpaidLeaveDays)
  const net = gross - pf - professionalTax - tds - unpaidLeaveDeduction
  return { basic, hra, allowances, gross, pf, professionalTax, tds, unpaidLeaveDeduction, net }
}
