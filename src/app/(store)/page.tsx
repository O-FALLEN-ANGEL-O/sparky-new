import { JewelImage as Image } from '@/components/jewel-image'
import Link from 'next/link'
import { ProductCard } from '@/components/store/product-card'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/server/auth'
import { getCategories, getFeatured, wishlistIds } from '@/lib/server/catalog'
import { Story } from './story'

const CHAPTERS = [
  {
    key: 'rings',
    name: 'Rings',
    title: 'A diamond, held by six platinum claws.',
    body: 'The Aurelia solitaire lifts a 0.75 ct round brilliant so light reaches it from every side. IGI certified, set by hand.',
    href: '/products/aurelia-solitaire-ring',
    cta: 'See the Aurelia ring',
    spec: { design: 'solitaire', metal: 'platinum', gem: 'diamond' },
  },
  {
    key: 'necklaces',
    name: 'Necklaces',
    title: 'Temple work, the way it has always been done.',
    body: 'Lakshmi coins and cabochon rubies strung on 22K gold by a family of karigars who have worked with us for three generations.',
    href: '/products/maharani-temple-necklace',
    cta: 'See the Maharani necklace',
    spec: { design: 'temple', metal: 'yellow_gold', gem: 'ruby' },
  },
  {
    key: 'earrings',
    name: 'Earrings',
    title: 'Chandbalis that move when you do.',
    body: 'Crescent moons in filigree gold, edged with seed pearls that sway with every turn of the head.',
    href: '/products/chandbali-pearl-earrings',
    cta: 'See the chandbalis',
    spec: { design: 'chandbali', metal: 'yellow_gold', gem: 'pearl' },
  },
  {
    key: 'bangles',
    name: 'Bangles',
    title: 'Hand-hammered 22K, cut to catch the light.',
    body: 'Our kangan is shaped on a mandrel, then faceted by hand so it flashes as you move. Sold singly, made to stack.',
    href: '/products/kangan-gold-bangle',
    cta: 'See the kangan',
    spec: { design: 'kangan', metal: 'yellow_gold', gem: 'none' },
  },
] as const

const STEPS = [
  { title: 'Sketch', body: 'Every piece starts as a pencil drawing at our Mangaluru bench, then becomes a CAD model accurate to a tenth of a millimetre.' },
  { title: 'Cast', body: 'The model is printed in wax and cast in recycled gold or platinum, then filed and polished by hand.' },
  { title: 'Set', body: 'Stones are matched by eye under daylight lamps and set one claw at a time. Polki and temple work use traditional jadau.' },
  { title: 'Hallmark', body: 'Gold is BIS hallmarked with a HUID number; diamonds over 0.3 ct carry an IGI certificate you can verify online.' },
]

export default async function Home() {
  const [categories, featured, user] = await Promise.all([getCategories(), getFeatured(8), getCurrentUser()])
  const saved = user ? await wishlistIds(user.id) : new Set<number>()
  const [first, second, ...rest] = categories

  return (
    <>
      <Story chapters={CHAPTERS.map((c) => ({ ...c, spec: { ...c.spec } }))} />

      <section className="container py-20 md:py-28" aria-labelledby="collections-heading">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 id="collections-heading" className="max-w-xl text-4xl md:text-5xl">Shop by piece</h2>
          <Link href="/shop" className="text-sm underline underline-offset-4">Browse everything</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-4 md:grid-rows-[300px_300px]">
          {[first, second].filter(Boolean).map((c, i) => (
            <CollectionTile key={c.slug} slug={c.slug} name={c.name} description={c.description} className={i === 0 ? 'md:col-span-2 md:row-span-2' : 'md:col-span-2'} large={i === 0} />
          ))}
          {rest.slice(0, 2).map((c) => (
            <CollectionTile key={c.slug} slug={c.slug} name={c.name} description={c.description} />
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {rest.slice(2).map((c) => (
            <CollectionTile key={c.slug} slug={c.slug} name={c.name} description={c.description} wide />
          ))}
        </div>
      </section>

      <section className="border-y bg-[#f6f2ea] py-20 dark:bg-ink md:py-28" aria-labelledby="featured-heading">
        <div className="container">
          <div className="mb-10 max-w-2xl">
            <h2 id="featured-heading" className="text-4xl md:text-5xl">Most loved this season</h2>
            <p className="mt-3 text-muted-foreground">The pieces our customers return for. Every price includes making charges; we add 3% GST at checkout and nothing else.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} saved={saved.has(p.id)} priority={i < 4} />
            ))}
          </div>
        </div>
      </section>

      <section className="container grid gap-12 py-20 md:grid-cols-[1fr_1.4fr] md:py-28" aria-labelledby="making-heading">
        <div className="md:sticky md:top-28 md:self-start">
          <h2 id="making-heading" className="text-4xl md:text-5xl">How a piece is made</h2>
          <p className="mt-4 max-w-md text-muted-foreground">Four steps, all under one roof. Ask to see the bench when you visit Lighthouse Hill Road.</p>
          <Button asChild variant="outline" size="lg" className="mt-8">
            <Link href="/about">Visit the atelier</Link>
          </Button>
        </div>
        <ol className="divide-y border-y">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[3rem_1fr] gap-4 py-8">
              <span className="font-headline text-3xl text-gold tabular">{i + 1}</span>
              <div>
                <h3 className="text-2xl">{s.title}</h3>
                <p className="mt-2 max-w-prose leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-velvet text-[#f6efe2]" aria-labelledby="promise-heading">
        <div className="container grid gap-10 py-20 md:grid-cols-3">
          <h2 id="promise-heading" className="text-4xl md:col-span-3 md:max-w-2xl md:text-5xl">What comes with every order</h2>
          <Pledge title="Insured to your door" body="Our own delivery partners hand it over only after you share a one-time code. Fully insured until then." />
          <Pledge title="Certified and hallmarked" body="BIS HUID on all gold. IGI certificates for diamonds over 0.3 ct, included in the box." />
          <Pledge title="Exchange for life" body="Bring any Sparkle piece back and we credit 100% of the gold value toward something new." />
        </div>
      </section>
    </>
  )
}

function Pledge({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-t border-white/15 pt-6">
      <h3 className="text-2xl text-gilt">{title}</h3>
      <p className="mt-3 max-w-sm leading-relaxed text-[#cbbfae]">{body}</p>
    </div>
  )
}

function CollectionTile({ slug, name, description, className = '', large = false, wide = false }: { slug: string; name: string; description: string; className?: string; large?: boolean; wide?: boolean }) {
  return (
    <Link href={`/shop?category=${slug}`} className={`group relative block overflow-hidden bg-velvet md:h-full ${className}`}>
      <div className={`relative ${wide ? 'aspect-[2/1]' : 'aspect-square md:aspect-auto md:h-full'}`}>
        <Image src={`/collections/${slug}.webp`} alt="" fill sizes={large ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 25vw, 100vw'} className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-[#f6efe2] md:p-6">
          <h3 className={large ? 'text-4xl' : 'text-3xl'}>{name}</h3>
          {(large || wide) && <p className="mt-2 max-w-sm text-sm text-[#d8ccbb]">{description}</p>}
        </div>
      </div>
    </Link>
  )
}
