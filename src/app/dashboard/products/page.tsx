import { JewelImage as Image } from '@/components/jewel-image'
import Link from 'next/link'
import { asc, eq } from 'drizzle-orm'
import { PageHeader, Pill } from '@/components/dash/ui'
import { Button } from '@/components/ui/button'
import { db, schema } from '@/db'
import { formatINR } from '@/lib/pricing'
import { requireUser } from '@/lib/server/auth'
import { METAL_LABEL } from '@/lib/server/catalog'

export const metadata = { title: 'Products' }

export default async function Products() {
  await requireUser({ permission: 'products.manage' })
  const rows = await db.select({ p: schema.products, cat: schema.categories.name }).from(schema.products).innerJoin(schema.categories, eq(schema.categories.id, schema.products.categoryId)).orderBy(asc(schema.categories.sort), asc(schema.products.name))
  return (
    <div>
      <PageHeader title="Products" description={`${rows.length} pieces in the catalogue.`} actions={<Button asChild><Link href="/dashboard/products/new">Add a piece</Link></Button>} />
      <ul className="divide-y rounded-lg border bg-card md:hidden">
        {rows.map(({ p, cat }) => (
          <li key={p.id}>
            <Link href={`/dashboard/products/${p.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-muted/40">
              <span className="relative h-12 w-12 shrink-0 rounded bg-[#f1ece2]"><Image src={p.images[0]} alt="" fill sizes="48px" className="rounded object-cover" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{p.name}</span>
                <span className="block truncate text-sm text-muted-foreground">{cat} · {p.purity} {METAL_LABEL[p.metal].toLowerCase()}</span>
              </span>
              <span className="shrink-0 text-right text-sm">
                <span className="block tabular">{formatINR(p.price)}</span>
                <span className="mt-0.5 block">{p.stock <= p.lowStockThreshold ? <Pill tone={p.stock === 0 ? 'danger' : 'warn'}>{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</Pill> : !p.active ? <Pill>Hidden</Pill> : <span className="text-muted-foreground tabular">{p.stock} in stock</span>}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="scroll-hint hidden rounded-lg border bg-card md:block">
        <table className="w-full min-w-[760px] text-[14px]">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Piece</th>
              <th className="px-4 py-2.5 font-medium">Collection</th>
              <th className="px-4 py-2.5 font-medium">Metal</th>
              <th className="px-4 py-2.5 text-right font-medium">Price</th>
              <th className="px-4 py-2.5 text-right font-medium">Stock</th>
              <th className="px-4 py-2.5 font-medium">Shown on store</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(({ p, cat }) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5">
                  <Link href={`/dashboard/products/${p.id}`} className="flex items-center gap-3 hover:underline">
                    <span className="relative h-10 w-10 shrink-0 rounded bg-[#f1ece2]"><Image src={p.images[0]} alt="" fill sizes="40px" className="rounded object-cover" /></span>
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{cat}</td>
                <td className="px-4 py-2.5">{p.purity} {METAL_LABEL[p.metal].toLowerCase()}</td>
                <td className="px-4 py-2.5 text-right tabular">{formatINR(p.price)}</td>
                <td className="px-4 py-2.5 text-right tabular">{p.stock <= p.lowStockThreshold ? <Pill tone={p.stock === 0 ? 'danger' : 'warn'}>{p.stock} {p.stock === 0 ? 'sold out' : 'low'}</Pill> : p.stock}</td>
                <td className="px-4 py-2.5">{p.active ? (p.featured ? <Pill tone="gold">Featured</Pill> : 'Yes') : <Pill>Hidden</Pill>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
