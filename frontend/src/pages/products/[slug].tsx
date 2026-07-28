import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAt: number | null;
  stock: number;
  rating: number;
  reviewCount: number;
  category: { id: string; name: string; slug: string } | null;
  reviews: Review[];
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });

  useEffect(() => {
    if (!slug) return;
    api.get(`/products/${slug}`)
      .then((res) => setProduct(res.data))
      .catch(() => router.push('/products'))
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = async () => {
    if (!user) return router.push('/login');
    try {
      await api.post('/cart/items', { productId: product!.id, quantity: qty });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add to cart');
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/products/${product!.id}/reviews`, reviewForm);
      const { data } = await api.get(`/products/${slug}`);
      setProduct(data);
      setReviewForm({ rating: 5, title: '', comment: '' });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit review');
    }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>;
  if (!product) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Link href="/products" className="text-sm text-primary-600 hover:underline">&larr; Back to Products</Link>

      <div className="mt-6 grid gap-12 md:grid-cols-2">
        <div className="aspect-square flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <span className="text-8xl text-gray-400">📦</span>
        </div>

        <div>
          {product.category && (
            <p className="text-sm text-primary-600">{product.category.name}</p>
          )}
          <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>

          <div className="mt-4 flex items-center gap-4">
            <span className="text-3xl font-bold text-primary-600">${Number(product.price).toFixed(2)}</span>
            {product.compareAt && Number(product.compareAt) > Number(product.price) && (
              <span className="text-lg text-gray-400 line-through">${Number(product.compareAt).toFixed(2)}</span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={star <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}>
                &#9733;
              </span>
            ))}
            <span className="ml-1 text-sm text-gray-500">({product.reviewCount} reviews)</span>
          </div>

          {product.description && (
            <p className="mt-6 text-gray-600 dark:text-gray-300">{product.description}</p>
          )}

          <div className="mt-6 flex items-center gap-4">
            <select
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value))}
              className="rounded-lg border p-3"
            >
              {Array.from({ length: Math.min(product.stock, 10) }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <button
              onClick={addToCart}
              disabled={product.stock === 0}
              className="flex-1 rounded-lg bg-primary-600 py-3 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {product.stock === 0 ? 'Out of Stock' : added ? 'Added!' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-xl font-bold mb-6">Customer Reviews</h2>

        {user && (
          <form onSubmit={submitReview} className="mb-8 rounded-xl border border-gray-200 p-6 dark:border-gray-800">
            <h3 className="font-medium mb-4">Write a Review</h3>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })}>
                  <span className={`text-2xl ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'}`}>&#9733;</span>
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Review title (optional)"
              value={reviewForm.title}
              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              className="mb-3 w-full rounded-lg border p-3 focus:border-primary-500 focus:outline-none"
            />
            <textarea
              placeholder="Your review"
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              className="mb-4 w-full rounded-lg border p-3 focus:border-primary-500 focus:outline-none"
              rows={3}
            />
            <button type="submit" className="rounded-lg bg-primary-600 px-6 py-2 text-white hover:bg-primary-700">
              Submit Review
            </button>
          </form>
        )}

        {product.reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{review.user.name}</span>
                  <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-1 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}>&#9733;</span>
                  ))}
                </div>
                {review.title && <p className="mt-1 font-medium">{review.title}</p>}
                {review.comment && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
