import React, { useEffect, useState } from 'react';
import { ProductCard } from './product-card';

export default function ProductGrid() {
  const [productList, setProductList] = useState<Array<any>>([]);

  useEffect(() => {
    async function fetchProducts() {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProductList(data);
    }
    fetchProducts();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {productList.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
