import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

interface CartItem {
  id: string;
  quantity: number;
  product: { id: string; name: string; slug: string; price: number; image: string | null; stock: number };
}

export default function CartPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const { data } = await api.get('/cart');
      setItems(data.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchCart(); else setLoading(false); }, [user]);

  const updateQty = async (itemId: string, quantity: number) => {
    await api.put(`/cart/items/${itemId}`, { quantity });
    fetchCart();
  };

  const removeItem = async (itemId: string) => {
    await api.delete(`/cart/items/${itemId}`);
    fetchCart();
  };

  const checkout = async () => {
    try {
      await api.post('/orders/checkout');
      router.push('/orders');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Checkout failed');
    }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>;

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <p className="text-gray-500">Your cart is empty.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div>
                  <h3 className="font-medium">{item.product.name}</h3>
                  <p className="text-sm text-gray-500">${Number(item.product.price).toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={item.quantity}
                    onChange={(e) => updateQty(item.id, parseInt(e.target.value))}
                    className="rounded border p-1"
                  >
                    {Array.from({ length: Math.min(item.product.stock, 10) }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <button onClick={() => removeItem(item.id)} className="text-sm text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className="border-t pt-4 text-right">
              <p className="text-lg font-bold">
                Total: ${items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0).toFixed(2)}
              </p>
              <button onClick={checkout} className="mt-4 rounded-lg bg-primary-600 px-8 py-3 text-white hover:bg-primary-700">
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
