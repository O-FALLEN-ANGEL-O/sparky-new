import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AddToCart } from '@/components/store/add-to-cart'
import { ProductCard } from '@/components/store/product-card'
import { WishlistButton } from '@/components/store/wishlist-button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { Design } from '@/components/three/designs'
import { formatINR, GST_RATE } from '@/lib/pricing'
import { getCurrentUser } from '@/lib/server/auth'
import { GEM_LABEL, METAL_LABEL, getProductBySlug, getRelated, wishlistIds } from '@/lib/server/catalog'
import { Gallery } from './gallery'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getProductBySlug((await params).slug)
  if (!found) return { title: 'Not found' }
  return { title: found.product.name, description: found.product.description, openGraph: { images: [found.product.images[0]] } }
}

export default async function ProductPage({ params }: Props) {
  const found = await getProductBySlug((await params).slug)
  if (!found) notFound()
  const { product: p, category } = found
  const [related, user] = await Promise.all([getRelated(p), getCurrentUser()])
  const saved = user ? await wishlistIds(user.id) : new Set<number>()

  const specs: [string, string][] = [
    ['Metal', `${p.purity} ${METAL_LABEL[p.metal].toLowerCase()}`],
    ['Weight', `${p.weightGrams} g`],
    ...(p.gem !== 'none' ? [['Stone', `${GEM_LABEL[p.gem]}${p.caratWeight ? `, ${p.caratWeight} ct total` : ''}`] as [string, string]] : []),
    ...(p.certificateNo ? [['Certificate', p.certificateNo] as [string, string]] : []),
    ['Hallmark', p.metal === 'silver' ? '925 sterling stamp' : p.metal === 'platinum' ? 'PT950 stamp' : 'BIS HUID'],
  ]

  return (
    <div className="container py-8 md:py-14">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/shop" className="hover:text-foreground">Shop</Link>
        <span className="mx-2">/</span>
        <Link href={`/shop?category=${category.slug}`} className="hover:text-foreground">{category.name}</Link>
      </nav>
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <Gallery images={p.images} name={p.name} spec={{ design: p.design as Design, metal: p.metal, gem: p.gem }} />
        <div className="lg:pt-4">
          <h1 className="text-balance text-5xl leading-[1.02] md:text-6xl">{p.name}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Rated {p.rating.toFixed(1)} out of 5 by {p.reviewCount} customers
          </p>
          <p className="tabular mt-6 text-3xl">
            {formatINR(p.price)}
            {p.compareAtPrice && p.compareAtPrice > p.price && <span className="ml-3 text-lg text-muted-foreground line-through">{formatINR(p.compareAtPrice)}</span>}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Includes making charges. {GST_RATE * 100}% GST added at checkout.</p>
          <p className="mt-6 max-w-prose text-pretty leading-relaxed">{p.description}</p>

          <dl className="mt-8 grid grid-cols-[8rem_1fr] gap-y-3 border-y py-5 text-[15px]">
            {specs.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 space-y-3">
            <AddToCart productId={p.id} name={p.name} stock={p.stock} />
            <div className="flex items-center justify-between text-sm">
              <WishlistButton productId={p.id} initial={saved.has(p.id)} withLabel />
              <span className={p.stock > 0 && p.stock <= p.lowStockThreshold ? 'text-kumkum' : 'text-muted-foreground'}>
                {p.stock === 0 ? 'Sold out' : p.stock <= p.lowStockThreshold ? `Only ${p.stock} left` : 'In stock, ships in 2 days'}
              </span>
            </div>
          </div>

          <Accordion type="single" collapsible className="mt-8">
            <AccordionItem value="delivery">
              <AccordionTrigger className="font-headline text-xl">Delivery and returns</AccordionTrigger>
              <AccordionContent className="space-y-2 leading-relaxed text-muted-foreground">
                <p>Free insured delivery across India in 3–6 days. Our delivery partner hands the parcel over only after you share the one-time code shown on your order page.</p>
                <p>Return unworn pieces within 15 days for a full refund. Engraved and made-to-order pieces can be exchanged but not refunded.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger className="font-headline text-xl">Caring for your piece</AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                Put it on after perfume and take it off before swimming. Store each piece separately in its pouch. Bring it to us once a year for a free clean and claw check.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-8 text-4xl">You might also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} saved={saved.has(r.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
