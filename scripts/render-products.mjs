/**
 * Shoot product photos with the 3D engine. Needs the dev server running (npm run dev)
 * and Chromium. Writes public/products/<slug>-{1,2,3}.webp and collection covers.
 *
 *   npm run render:products [-- --only=slug1,slug2] [-- --base=http://localhost:9002] [-- --force]
 * Existing images are kept unless --force is passed.
 */
import { mkdir } from 'node:fs/promises'
import { openLocalD1 } from './local-d1.mjs'
import sharp from 'sharp'
import { chromium } from 'playwright-core'
import { existsSync } from 'node:fs'
const force = process.argv.includes('--force')

const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1]
const base = arg('base') ?? 'http://localhost:9002'
const only = arg('only')?.split(',')

const local = openLocalD1()
const products = await local.q('select p.slug, p.design, p.metal, p.gem, c.slug as category from products p join categories c on c.id = p.category_id order by p.id')
local.close()

const browser = await chromium.launch({
  executablePath: process.env.CHROME || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
await mkdir('public/products', { recursive: true })
await mkdir('public/collections', { recursive: true })

async function shoot(query, out, size = 900) {
  if (!force && existsSync(out)) return
  for (let attempt = 1; attempt <= 3; attempt++) {
    const page = await browser.newPage({ viewport: { width: size, height: size } })
    try {
      await page.goto(`${base}/studio?${query}`, { waitUntil: 'networkidle', timeout: 180000 })
      await page.waitForSelector('body[data-ready="1"]', { state: 'attached', timeout: 180000 })
      const png = await page.screenshot()
      await sharp(png).webp({ quality: 84 }).toFile(out)
      console.log('  ', out)
      return
    } catch (e) {
      console.warn(`   retry ${attempt} for ${out}: ${e.message.split('\n')[0]}`)
    } finally {
      await page.close()
    }
  }
  console.error(`   gave up on ${out}`)
}

const jobs = []
for (const p of products) {
  if (only && !only.includes(p.slug)) continue
  for (const angle of [0, 1, 2]) {
    jobs.push(() => shoot(`design=${p.design}&metal=${p.metal}&gem=${p.gem}&angle=${angle}`, `public/products/${p.slug}-${angle + 1}.webp`))
  }
}
// one velvet cover per collection, using its first product
const seen = new Set()
for (const p of products) {
  if (seen.has(p.category) || (only && !only.includes(p.slug))) continue
  seen.add(p.category)
  jobs.push(() => shoot(`design=${p.design}&metal=${p.metal}&gem=${p.gem}&bg=velvet&angle=1`, `public/collections/${p.category}.webp`, 800))
}

console.log(`Rendering ${jobs.length} images…`)
const CONCURRENCY = 3
let next = 0
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (next < jobs.length) await jobs[next++]()
  }),
)
await browser.close()
console.log('Done.')
