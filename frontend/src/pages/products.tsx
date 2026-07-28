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
  isFeatured: boolean;
  category: { name: string; slug: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [appliedSearch, setAppliedSearch] = useState('');

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '12', sort, order: 'desc' });
    if (appliedSearch) params.set('search', appliedSearch);
    if (selectedCategory) params.set('category', selectedCategory);

    api.get(`/products?${params}`)
      .then((res) => {
        setProducts(res.data.products);
        setTotalPages(res.data.pagination.pages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, selectedCategory, sort, appliedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      <div className="mb-8 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border p-3 focus:border-primary-500 focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-primary-600 px-6 py-3 text-white hover:bg-primary-700">
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setSelectedCategory(''); setPage(1); }}
            className={`rounded-full px-4 py-1.5 text-sm ${!selectedCategory ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
              className={`rounded-full px-4 py-1.5 text-sm ${selectedCategory === cat.slug ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border p-2 text-sm"
        >
          <option value="createdAt">Newest</option>
          <option value="price">Price: Low to High</option>
          <option value="rating">Top Rated</option>
          <option value="name">Name</option>
        </select>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No products found.</p>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group rounded-xl border border-gray-200 p-4 hover:shadow-lg dark:border-gray-800"
              >
                <div className="aspect-square mb-4 flex items-center justify-center bg-gray-100 rounded-lg dark:bg-gray-800">
                  <span className="text-4xl text-gray-400">📦</span>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`text-xs ${star <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>&#9733;</span>
                  ))}
                  <span className="text-xs text-gray-400 ml-1">{product.rating > 0 ? product.rating.toFixed(1) : ''}</span>
                </div>
                <h3 className="font-medium group-hover:text-primary-600 truncate">{product.name}</h3>
                <p className="mt-1 text-lg font-bold text-primary-600">${Number(product.price).toFixed(2)}</p>
                {product.category && (
                  <p className="mt-1 text-xs text-gray-500">{product.category.name}</p>
                )}
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`rounded-lg px-4 py-2 text-sm ${p === page ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
