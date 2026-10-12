import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductCard } from '@/components/store/product-card'
import { getCurrentUser } from '@/lib/server/auth'
import { GEM_LABEL, METAL_LABEL, getCategories, listProducts, wishlistIds, type ShopFilters } from '@/lib/server/catalog'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Shop' }

const PRICE_BANDS = [
  { key: 'u50', label: 'Under ₹50,000', min: 0, max: 50000 },
  { key: '50-150', label: '₹50,000 – ₹1.5 lakh', min: 50000, max: 150000 },
  { key: '150-300', label: '₹1.5 – 3 lakh', min: 150000, max: 300000 },
  { key: 'o300', label: 'Above ₹3 lakh', min: 300000, max: 0 },
]
const SORTS = [
  { key: 'featured', label: 'Featured' },
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price, low to high' },
  { key: 'price_desc', label: 'Price, high to low' },
  { key: 'rating', label: 'Best rated' },
]

type SP = Record<string, string | string[] | undefined>
const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? v.split(',') : []).filter(Boolean)

export default async function Shop({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const band = PRICE_BANDS.find((b) => b.key === sp.price)
  const filters: ShopFilters = {
    category: typeof sp.category === 'string' ? sp.category : undefined,
    metal: list(sp.metal),
    gem: list(sp.gem),
    min: band?.min || undefined,
    max: band?.max || undefined,
    q: typeof sp.q === 'string' ? sp.q : undefined,
    sort: (typeof sp.sort === 'string' ? sp.sort : 'featured') as ShopFilters['sort'],
    inStock: sp.stock === '1',
  }
  const [categories, products, user] = await Promise.all([getCategories(), listProducts(filters), getCurrentUser()])
  const saved = user ? await wishlistIds(user.id) : new Set<number>()
  const category = categories.find((c) => c.slug === filters.category)

  const href = (patch: Record<string, string | string[] | null>) => {
    const next = new URLSearchParams()
    const merged: Record<string, string | string[] | undefined | null> = { ...sp, ...patch }
    for (const [k, v] of Object.entries(merged)) {
      if (v == null || v === '' || (Array.isArray(v) && !v.length)) continue
      next.set(k, Array.isArray(v) ? v.join(',') : v)
    }
    const s = next.toString()
    return s ? `/shop?${s}` : '/shop'
  }
  const toggle = (key: 'metal' | 'gem', value: string) => {
    const cur = list(sp[key])
    return href({ [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] })
  }
  const activeCount = (filters.metal?.length ?? 0) + (filters.gem?.length ?? 0) + (band ? 1 : 0) + (filters.inStock ? 1 : 0)

  const filterPanel = (
    <div className="space-y-8 text-[15px]">
      <FilterGroup title="Metal">
        {Object.entries(METAL_LABEL).map(([k, label]) => (
          <Check key={k} href={toggle('metal', k)} checked={filters.metal!.includes(k)} label={label} />
        ))}
      </FilterGroup>
      <FilterGroup title="Stone">
        {Object.entries(GEM_LABEL).map(([k, label]) => (
          <Check key={k} href={toggle('gem', k)} checked={filters.gem!.includes(k)} label={label} />
        ))}
      </FilterGroup>
      <FilterGroup title="Price">
        {PRICE_BANDS.map((b) => (
          <Check key={b.key} href={href({ price: sp.price === b.key ? null : b.key })} checked={sp.price === b.key} label={b.label} radio />
        ))}
      </FilterGroup>
      <FilterGroup title="Availability">
        <Check href={href({ stock: filters.inStock ? null : '1' })} checked={!!filters.inStock} label="In stock only" />
      </FilterGroup>
      {activeCount > 0 && (
        <Link href={href({ metal: null, gem: null, price: null, stock: null })} className="text-sm underline underline-offset-4">
          Clear filters
        </Link>
      )}
    </div>
  )

  return (
    <div className="container py-10 md:py-14">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-5xl md:text-6xl">{filters.q ? `Results for “${filters.q}”` : category?.name ?? 'All jewellery'}</h1>
        <p className="mt-3 text-muted-foreground">{filters.q ? `${products.length} piece${products.length === 1 ? '' : 's'} found.` : category?.description ?? 'Every piece in the collection, hallmarked and ready to ship.'}</p>
      </header>

      <nav aria-label="Categories" className="-mx-4 mb-8 flex gap-2 chip-row overflow-x-auto px-4 pb-1">
        <Pill href={href({ category: null })} active={!filters.category}>All</Pill>
        {categories.map((c) => (
          <Pill key={c.slug} href={href({ category: c.slug })} active={filters.category === c.slug}>
            {c.name}
          </Pill>
        ))}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">{filterPanel}</aside>
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b pb-4">
            <details className="lg:hidden [&[open]]:order-last [&[open]]:w-full">
              <summary className="cursor-pointer list-none py-2 text-sm underline underline-offset-4">Filters{activeCount ? ` (${activeCount})` : ''}</summary>
              <div className="mt-6 pb-4">{filterPanel}</div>
            </details>
            <p className="hidden text-sm text-muted-foreground lg:block">{products.length} pieces</p>
            <form className="flex min-w-0 items-center gap-2 text-sm" action="/shop">
              {Object.entries(sp).map(([k, v]) => (k === 'sort' || v == null ? null : <input key={k} type="hidden" name={k} value={Array.isArray(v) ? v.join(',') : v} />))}
              <label htmlFor="sort" className="text-muted-foreground">Sort</label>
              <select id="sort" name="sort" defaultValue={filters.sort} className="h-9 min-w-0 max-w-[10.5rem] border bg-background px-2">
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
              <button className="h-9 border px-3">Apply</button>
            </form>
          </div>
          {products.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} saved={saved.has(p.id)} priority={i < 3} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="font-headline text-3xl">Nothing matches those filters.</p>
              <p className="mt-2 text-muted-foreground">Try removing a filter, or browse the full collection.</p>
              <Link href="/shop" className="mt-6 inline-block underline underline-offset-4">See all jewellery</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 font-headline text-xl">{title}</legend>
      <div className="space-y-2">{children}</div>
    </fieldset>
  )
}

function Check({ href, checked, label, radio }: { href: string; checked: boolean; label: string; radio?: boolean }) {
  return (
    <Link href={href} scroll={false} role={radio ? 'radio' : 'checkbox'} aria-checked={checked} className="flex items-center gap-3 text-muted-foreground hover:text-foreground">
      <span className={cn('flex h-4 w-4 items-center justify-center border', radio && 'rounded-full', checked ? 'border-foreground bg-foreground' : 'border-input')}>
        {checked && <span className={cn('h-1.5 w-1.5 bg-background', radio && 'rounded-full')} />}
      </span>
      <span className={checked ? 'text-foreground' : ''}>{label}</span>
    </Link>
  )
}

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className={cn('shrink-0 border px-4 py-2 text-sm transition-colors', active ? 'border-foreground bg-foreground text-background' : 'hover:border-foreground')}>
      {children}
    </Link>
  )
}
