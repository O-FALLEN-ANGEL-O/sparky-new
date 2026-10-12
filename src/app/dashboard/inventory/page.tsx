import Link from 'next/link'
import { asc, desc, eq } from 'drizzle-orm'
import { PageHeader, Panel, Pill, Stat } from '@/components/dash/ui'
import { db, schema } from '@/db'
import { dateTime } from '@/lib/format'
import { formatCompactINR } from '@/lib/pricing'
import { requireUser } from '@/lib/server/auth'
import { cn } from '@/lib/utils'
import { AdjustForm } from './adjust-form'

export const metadata = { title: 'Inventory' }

const REASON: Record<string, string> = { sale: 'Sale', restock: 'Restock', adjustment: 'Correction', return: 'Return', cancellation: 'Cancelled order' }

export default async function Inventory({ searchParams }: { searchParams: Promise<{ filter?: string; product?: string }> }) {
  await requireUser({ permission: 'inventory.manage' })
  const sp = await searchParams
  const productId = Number(sp.product) || undefined
  const [products, moves] = await Promise.all([
    db.select().from(schema.products).orderBy(asc(schema.products.stock)),
    db
      .select({ m: schema.inventoryMovements, name: schema.products.name, by: schema.users.name })
      .from(schema.inventoryMovements)
      .innerJoin(schema.products, eq(schema.products.id, schema.inventoryMovements.productId))
      .leftJoin(schema.users, eq(schema.users.id, schema.inventoryMovements.userId))
      .where(productId ? eq(schema.inventoryMovements.productId, productId) : undefined)
      .orderBy(desc(schema.inventoryMovements.createdAt), desc(schema.inventoryMovements.id))
      .limit(40),
  ])
  const low = products.filter((p) => p.stock <= p.lowStockThreshold)
  const shown = sp.filter === 'low' ? low : products
  const value = products.reduce((s, p) => s + p.stock * p.price, 0)
  const units = products.reduce((s, p) => s + p.stock, 0)
  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Stock on hand for every piece. Sales and cancellations update it automatically; record workshop batches and count corrections here." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Pieces in stock" value={String(units)} note={`${products.length} designs`} />
        <Stat label="Stock value at retail" value={formatCompactINR(value)} note="Units × current price" />
        <Stat label="Low or sold out" value={String(low.length)} note="At or below reorder level" href="/dashboard/inventory?filter=low" />
        <Stat label="Sold out" value={String(products.filter((p) => p.stock === 0).length)} note="Hidden from checkout" />
      </div>
      <Panel title="Record a stock change">
        <AdjustForm products={products.map((p) => ({ id: p.id, name: p.name, stock: p.stock }))} initialProductId={productId} />
      </Panel>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Stock levels"
          action={
            <div className="flex gap-1 text-sm">
              <Link href="/dashboard/inventory" className={cn('rounded px-2 py-1', !sp.filter ? 'bg-muted' : 'text-muted-foreground')}>All</Link>
              <Link href="/dashboard/inventory?filter=low" className={cn('rounded px-2 py-1', sp.filter === 'low' ? 'bg-muted' : 'text-muted-foreground')}>Low only</Link>
            </div>
          }
          bodyClassName="p-0"
        >
          <ul className="divide-y">
            {shown.map((p) => (
              <li key={p.id}>
                <Link href={`/dashboard/inventory?product=${p.id}${sp.filter ? `&filter=${sp.filter}` : ''}`} className={cn('flex items-center gap-3 px-5 py-2.5 hover:bg-muted/30', productId === p.id && 'bg-muted/50')}>
                  <span className="flex-1 text-[15px]">{p.name}</span>
                  {p.stock === 0 ? <Pill tone="danger">Sold out</Pill> : p.stock <= p.lowStockThreshold ? <Pill tone="warn">Low</Pill> : null}
                  <span className="w-10 text-right tabular">{p.stock}</span>
                  <span className="w-20 text-right text-xs text-muted-foreground">alert at {p.lowStockThreshold}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={productId ? `History: ${products.find((p) => p.id === productId)?.name}` : 'Recent movements'} action={productId ? <Link href="/dashboard/inventory" className="text-sm underline underline-offset-4">Show all</Link> : undefined} bodyClassName="p-0">
          <ul className="divide-y">
            {moves.map(({ m, name, by }) => (
              <li key={m.id} className="grid grid-cols-[1fr_auto] gap-x-4 px-5 py-2.5 text-sm">
                <span>{productId ? REASON[m.reason] : name}<span className="block text-muted-foreground">{productId ? m.note ?? '' : REASON[m.reason]}{by ? ` · ${by}` : ''} · {dateTime(m.createdAt)}</span></span>
                <span className="text-right tabular">
                  <span className={m.change > 0 ? 'text-ok' : ''}>{m.change > 0 ? `+${m.change}` : m.change}</span>
                  <span className="block text-xs text-muted-foreground">now {m.stockAfter}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

