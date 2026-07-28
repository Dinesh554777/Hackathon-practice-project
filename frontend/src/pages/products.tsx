import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  rating: number;
  stock: number;
  category: { name: string; slug: string } | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?limit=20')
      .then((res) => setProducts(res.data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">All Products</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group rounded-xl border border-gray-200 p-4 hover:shadow-lg dark:border-gray-800"
          >
            <div className="aspect-square mb-4 flex items-center justify-center bg-gray-100 rounded-lg dark:bg-gray-800">
              <span className="text-4xl text-gray-400">📦</span>
            </div>
            <h3 className="font-medium group-hover:text-primary-600">{product.name}</h3>
            <p className="mt-1 text-lg font-bold text-primary-600">${Number(product.price).toFixed(2)}</p>
            {product.category && (
              <p className="mt-1 text-xs text-gray-500">{product.category.name}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
