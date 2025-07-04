'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { motion } from 'framer-motion';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <motion.div whileHover={{ y: -8, transition: { duration: 0.3 } }}>
      <Card className="w-full overflow-hidden border-0 bg-transparent shadow-none">
        <div className="overflow-hidden rounded-lg">
          <Link href={`/products/${product.id}`} className="block">
            <Image
              src={product.images[0]}
              alt={product.name}
              width={400}
              height={400}
              className="object-cover w-full aspect-square transition-transform duration-500 hover:scale-110"
              data-ai-hint="jewelry piece"
            />
          </Link>
        </div>
        <CardContent className="p-4 text-center">
          <h3 className="text-lg font-headline">
            <Link href={`/products/${product.id}`} className="hover:text-primary transition-colors">
              {product.name}
            </Link>
          </h3>
          <p className="text-xl font-semibold text-primary mt-1">${product.price.toFixed(2)}</p>
        </CardContent>
        <CardFooter className="p-0">
          <Button size="lg" className="w-full">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
