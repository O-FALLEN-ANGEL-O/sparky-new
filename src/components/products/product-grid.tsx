import { getProducts } from '@/lib/db';
import { ProductCard } from './product-card';

export default async function ProductGrid() {
  const productList = await getProducts();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {productList.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
