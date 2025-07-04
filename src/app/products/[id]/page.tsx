import { getProductById } from '@/lib/db';
import type { Product } from '@/lib/mock-data';
import Header from '@/components/common/header';
import Footer from '@/components/common/footer';
import { ProductImageCarousel } from '@/components/products/product-image-carousel';
import { Button } from '@/components/ui/button';
import { Star, ShoppingCart, Heart, ShieldCheck, Truck, Gem } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ProductGrid from '@/components/products/product-grid';
import { Suspense } from 'react';
import { ProductCardSkeleton } from '@/components/products/product-card-skeleton';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { CertificateViewer } from '@/components/products/certificate-viewer';

const Dynamic3DViewer = dynamic(
  () => import('@/components/products/product-3d-viewer').then(mod => mod.Product3DViewer),
  {
      ssr: false,
      loading: () => <Skeleton className="w-full h-96 rounded-lg" />
  }
);

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <ProductImageCarousel images={product.images} alt={product.name} />
          </div>
          <div className="space-y-6">
            <div>
                <h1 className="text-4xl lg:text-5xl font-bold font-headline">{product.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-5 h-5 ${i < Math.round(product.rating) ? 'text-primary fill-primary' : 'text-muted-foreground/50'}`} />
                        ))}
                        <span className="text-muted-foreground ml-2 text-sm">({product.rating.toFixed(1)} from 24 reviews)</span>
                    </div>
                </div>
                 <p className="text-4xl font-semibold text-primary mt-4">${product.price.toFixed(2)}</p>
            </div>
            
            <p className="text-muted-foreground text-lg leading-relaxed">{product.description}</p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button size="lg" className="w-full sm:w-auto flex-1">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Heart className="mr-2 h-5 w-5" />
                Add to Wishlist
              </Button>
            </div>

            <Separator />

            <Accordion type="single" collapsible defaultValue='item-1' className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-headline">Product Details</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground space-y-2">
                  <p>Category: {product.category}</p>
                  <p>Stock: {product.stock} available</p>
                  <p>SKU: {product.id.toUpperCase()}-00{product.stock}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg font-headline">Our Guarantee</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground space-y-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                    <p>Ethically sourced and conflict-free materials.</p>
                  </div>
                   <div className="flex items-center gap-3">
                    <Gem className="h-6 w-6 text-primary" />
                    <p>Authenticated and certified precious gems.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Truck className="h-6 w-6 text-primary" />
                    <p>Free, insured, and fast worldwide shipping.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {(product.modelUrl || product.certificateUrl) && (
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                {product.modelUrl && <Dynamic3DViewer modelUrl={product.modelUrl} />}
                {product.certificateUrl && <CertificateViewer certificateUrl={product.certificateUrl} />}
            </div>
        )}

        <div className="mt-20 md:mt-32">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline text-center mb-12 text-primary">
                You Might Also Like
            </h2>
            <div className="mx-auto max-w-7xl">
              <Suspense
                fallback={
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <ProductCardSkeleton key={i} />
                    ))}
                  </div>
                }
              >
                <ProductGrid />
              </Suspense>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
