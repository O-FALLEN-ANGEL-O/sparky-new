import type { Metadata } from 'next'
import { JewelImage as Image } from '@/components/jewel-image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getSetting } from '@/lib/server/settings'

export const metadata: Metadata = { title: 'Our atelier' }

export default async function About() {
  const store = await getSetting('store')
  return (
    <div>
      <section className="bg-velvet text-[#f6efe2]">
        <div className="container grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="text-5xl leading-[1.02] md:text-7xl">One bench, three generations.</h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[#cbbfae]">
              Sparkle began as a single workbench on Lighthouse Hill Road. Today the same families of karigars make every piece we sell, alongside designers who draw in pencil before anything goes near a computer.
            </p>
          </div>
          <div className="relative aspect-square">
            <Image src="/collections/necklaces.webp" alt="The Maharani temple necklace on velvet" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" priority />
          </div>
        </div>
      </section>
      <section className="container grid gap-12 py-20 md:grid-cols-3">
        <div>
          <h2 className="text-3xl">Visit us</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{store.address}</p>
          <p className="mt-2 text-muted-foreground">Open 10:30 am – 8:30 pm, closed Tuesdays.</p>
        </div>
        <div>
          <h2 className="text-3xl">Talk to a consultant</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">Bridal and custom pieces start with a conversation. Call {store.phone} or write to {store.email}.</p>
        </div>
        <div>
          <h2 className="text-3xl">Bring your old gold</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">We test it in front of you and credit its full value toward a new piece, with no deduction.</p>
        </div>
      </section>
      <div className="container pb-20">
        <Button asChild size="lg"><Link href="/shop">Browse the collection</Link></Button>
      </div>
    </div>
  )
}
