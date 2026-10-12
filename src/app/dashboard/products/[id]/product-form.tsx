'use client'

import { useActionState, useState } from 'react'
import { saveProduct } from '@/app/actions/staff'
import { Field, FormMessage, Submit } from '@/components/forms'

type Opt = { value: string; label: string }
type P = Partial<{
  id: number; name: string; slug: string; description: string; categoryId: number; price: number; compareAtPrice: number | null; metal: string; gem: string; design: string
  purity: string; weightGrams: number; caratWeight: number | null; lowStockThreshold: number; featured: boolean; active: boolean; certificateNo: string | null
}>

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function Select({ name, label, options, defaultValue, error }: { name: string; label: string; options: Opt[]; defaultValue?: string | number; error?: string }) {
  return (
    <Field label={label} name={name} error={error}>
      <select id={`f-${name}`} name={name} defaultValue={defaultValue} className="h-11 w-full border bg-background px-3 text-[15px]">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )
}

export function ProductForm({ product, categories, metals, gems, designs, saved }: { product: P; categories: Opt[]; metals: Opt[]; gems: Opt[]; designs: Opt[]; saved?: boolean }) {
  const [state, action] = useActionState(saveProduct, saved ? { ok: true, message: 'Saved. Changes are live on the store.' } : null)
  const [slug, setSlug] = useState(product.slug ?? '')
  const e = state?.fieldErrors ?? {}
  const isNew = !product.id
  return (
    <form action={action} className="space-y-8" noValidate>
      {product.id && <input type="hidden" name="id" value={product.id} />}
      <FormMessage state={state} />
      <section className="grid gap-4 md:grid-cols-2">
        <Field label="Name" name="name" defaultValue={product.name} error={e.name} onChange={(ev) => isNew && setSlug(slugify(ev.currentTarget.value))} />
        <Field label="Web address" name="slug" value={slug} onChange={(ev) => setSlug(ev.currentTarget.value)} error={e.slug} hint={`sparkle.com/products/${slug || '…'}`} />
        <Field label="Description" name="description" error={e.description} className="md:col-span-2">
          <textarea id="f-description" name="description" defaultValue={product.description} rows={4} className="w-full border bg-background p-3 text-[15px]" />
        </Field>
        <Select name="categoryId" label="Collection" options={categories} defaultValue={product.categoryId} error={e.categoryId} />
        <Select name="design" label="3D design" options={designs} defaultValue={product.design} error={e.design} />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <Select name="metal" label="Metal" options={metals} defaultValue={product.metal} />
        <Field label="Purity" name="purity" defaultValue={product.purity ?? '22K'} error={e.purity} hint="22K, 18K, PT950, 925" />
        <Field label="Weight (g)" name="weightGrams" type="number" step="0.1" defaultValue={product.weightGrams} error={e.weightGrams} />
        <Select name="gem" label="Stone" options={gems} defaultValue={product.gem ?? 'none'} />
        <Field label="Carat weight (optional)" name="caratWeight" type="number" step="0.01" defaultValue={product.caratWeight ?? ''} error={e.caratWeight} />
        <Field label="Certificate number (optional)" name="certificateNo" defaultValue={product.certificateNo ?? ''} />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <Field label="Price (₹, incl. making)" name="price" type="number" step="1" defaultValue={product.price} error={e.price} />
        <Field label="Was price (optional)" name="compareAtPrice" type="number" step="1" defaultValue={product.compareAtPrice ?? ''} hint="Shown struck through" />
        <Field label="Low-stock alert at" name="lowStockThreshold" type="number" defaultValue={product.lowStockThreshold ?? 5} />
        {isNew && <Field label="Opening stock" name="openingStock" type="number" defaultValue={0} hint="Adjust later in Inventory" />}
      </section>
      <section className="flex flex-wrap gap-6 text-[15px]">
        <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={product.active ?? true} className="h-4 w-4 accent-[#15110E]" /> Show on the store</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={product.featured ?? false} className="h-4 w-4 accent-[#15110E]" /> Feature on the homepage</label>
      </section>
      <Submit size="lg">{isNew ? 'Create piece' : 'Save changes'}</Submit>
      {isNew && <p className="text-sm text-muted-foreground">Photos come from the 3D studio: run <code>npm run render:products -- --only={slug || 'your-slug'}</code> after saving.</p>}
    </form>
  )
}
