import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/orders')
      .then((res) => setOrders(res.data.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold mb-8">My Orders</h1>
        {loading ? (
          <div className="flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">No orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-gray-500">{order.orderNumber}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{order.status}</span>
                </div>
                <p className="text-sm">{order.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className="font-bold">${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
