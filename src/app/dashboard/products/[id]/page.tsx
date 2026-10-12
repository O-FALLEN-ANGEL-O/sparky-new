import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'
import { PageHeader } from '@/components/dash/ui'
import { db, schema } from '@/db'
import { requireUser } from '@/lib/server/auth'
import { GEM_LABEL, METAL_LABEL } from '@/lib/server/catalog'
import { ProductForm } from './product-form'

const label = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireUser({ permission: 'products.manage' })
  const { id } = await params
  const { saved } = await searchParams
  const isNew = id === 'new'
  const product = isNew ? {} : (await db.select().from(schema.products).where(eq(schema.products.id, Number(id))))[0]
  if (!isNew && !product) notFound()
  const categories = await db.select().from(schema.categories).orderBy(asc(schema.categories.sort))
  return (
    <div className="max-w-4xl">
      <Link href="/dashboard/products" className="text-sm text-muted-foreground hover:text-foreground">All products</Link>
      <PageHeader title={isNew ? 'Add a piece' : (product as { name: string }).name} description={isNew ? 'It goes live on the store as soon as you save, if “Show on the store” is ticked.' : 'Changes appear on the store immediately.'} actions={!isNew && <Link href={`/products/${(product as { slug: string }).slug}`} className="text-sm underline underline-offset-4">View on store</Link>} />
      <ProductForm
        product={product as never}
        saved={saved === '1'}
        categories={categories.map((c) => ({ value: String(c.id), label: c.name }))}
        metals={schema.metalEnum.enumValues.map((m) => ({ value: m, label: METAL_LABEL[m] }))}
        gems={schema.gemEnum.enumValues.map((g) => ({ value: g, label: GEM_LABEL[g] }))}
        designs={schema.designEnum.enumValues.map((d) => ({ value: d, label: label(d) }))}
      />
    </div>
  )
}
