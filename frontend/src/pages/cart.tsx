import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

interface CartItem {
  id: string;
  quantity: number;
  product: { id: string; name: string; slug: string; price: number; image: string | null; stock: number };
}

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

export default function CartPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: 'Home', street: '', city: '', state: '', zip: '' });

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

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/addresses');
      setAddresses(data);
      const def = data.find((a: Address) => a.isDefault) || data[0];
      if (def) setSelectedAddress(def.id);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user) { fetchCart(); fetchAddresses(); }
    else setLoading(false);
  }, [user]);

  const updateQty = async (itemId: string, quantity: number) => {
    await api.put(`/cart/items/${itemId}`, { quantity });
    fetchCart();
  };

  const removeItem = async (itemId: string) => {
    await api.delete(`/cart/items/${itemId}`);
    fetchCart();
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/addresses', addressForm);
    setShowAddressForm(false);
    setAddressForm({ label: 'Home', street: '', city: '', state: '', zip: '' });
    fetchAddresses();
  };

  const checkout = async () => {
    setCheckingOut(true);
    try {
      await api.post('/orders/checkout', {
        shippingAddressId: selectedAddress || undefined,
        paymentMethod,
      });
      router.push('/orders');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const subtotal = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + shipping + tax;

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>;

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Your cart is empty.</p>
            <Link href="/products" className="text-primary-600 hover:underline">Continue Shopping</Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                      <span className="text-2xl text-gray-400">📦</span>
                    </div>
                    <div>
                      <Link href={`/products/${item.product.slug}`} className="font-medium hover:text-primary-600">
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-gray-500">${Number(item.product.price).toFixed(2)} each</p>
                    </div>
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
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
                <h2 className="font-bold mb-4">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span></div>
                  <div className="flex justify-between"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span><span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium">Payment Method</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 w-full rounded-lg border p-2">
                    <option value="card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Stripe</option>
                  </select>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Shipping Address</label>
                    <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-xs text-primary-600 hover:underline">
                      {showAddressForm ? 'Cancel' : '+ Add'}
                    </button>
                  </div>
                  {showAddressForm && (
                    <form onSubmit={addAddress} className="mt-2 space-y-2">
                      <input type="text" placeholder="Label (Home/Work)" value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} className="w-full rounded border p-2 text-sm" required />
                      <input type="text" placeholder="Street" value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} className="w-full rounded border p-2 text-sm" required />
                      <div className="flex gap-2">
                        <input type="text" placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="flex-1 rounded border p-2 text-sm" required />
                        <input type="text" placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="flex-1 rounded border p-2 text-sm" required />
                        <input type="text" placeholder="ZIP" value={addressForm.zip} onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })} className="w-20 rounded border p-2 text-sm" required />
                      </div>
                      <button type="submit" className="w-full rounded-lg bg-primary-600 py-2 text-sm text-white hover:bg-primary-700">Save Address</button>
                    </form>
                  )}
                  {addresses.length > 0 && !showAddressForm && (
                    <select value={selectedAddress} onChange={(e) => setSelectedAddress(e.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm">
                      {addresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>{addr.label}: {addr.street}, {addr.city}</option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  onClick={checkout}
                  disabled={checkingOut}
                  className="mt-6 w-full rounded-lg bg-primary-600 py-3 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {checkingOut ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
