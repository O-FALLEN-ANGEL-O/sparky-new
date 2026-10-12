import { JewelImage as Image } from '@/components/jewel-image'
import Link from 'next/link'
import type { Product } from '@/lib/server/catalog'
import { GEM_LABEL, METAL_LABEL } from '@/lib/server/catalog'
import { formatINR } from '@/lib/pricing'
import { WishlistButton } from './wishlist-button'

export function ProductCard({ product, saved = false, priority = false }: { product: Product; saved?: boolean; priority?: boolean }) {
  const low = product.stock > 0 && product.stock <= product.lowStockThreshold
  return (
    <article className="group relative">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#f1ece2]">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-opacity duration-500 group-hover:opacity-0"
            priority={priority}
          />
          {product.images[1] && (
            <Image src={product.images[1]} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
          )}
          {product.stock === 0 ? (
            <span className="absolute left-3 top-3 bg-background/90 px-2 py-1 text-xs">Sold out</span>
          ) : low ? (
            <span className="absolute left-3 top-3 bg-background/90 px-2 py-1 text-xs text-kumkum">Only {product.stock} left</span>
          ) : null}
        </div>
        <div className="mt-3 space-y-1 pr-8">
          <h3 className="font-headline text-xl leading-tight">{product.name}</h3>
          <p className="text-sm text-muted-foreground">
            {product.purity} {METAL_LABEL[product.metal].toLowerCase()}
            {product.gem !== 'none' ? `, ${GEM_LABEL[product.gem].toLowerCase()}` : ''}
          </p>
          <p className="tabular text-[15px]">
            {formatINR(product.price)}
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="ml-2 text-sm text-muted-foreground line-through">{formatINR(product.compareAtPrice)}</span>
            )}
          </p>
        </div>
      </Link>
      <div className="absolute bottom-12 right-0">
        <WishlistButton productId={product.id} initial={saved} />
      </div>
    </article>
  )
}
