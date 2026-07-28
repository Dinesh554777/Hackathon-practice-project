import { useEffect, useState } from 'react';
import AdminGuard from '@/components/AdminGuard';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  items: { name: string; quantity: number; price: number }[];
}

const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const paymentStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetch = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/orders/admin/all?${params}`)
      .then((res) => setOrders(res.data.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [statusFilter]);

  const updateStatus = async (id: string, field: string, value: string) => {
    await api.patch(`/orders/${id}/status`, { [field]: value });
    fetch();
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Orders</h1>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border p-2 text-sm">
            <option value="">All Statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Order #</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Items</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Payment</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b">
                    <td className="py-3 font-mono text-xs">{o.orderNumber}</td>
                    <td className="py-3">
                      <p className="font-medium">{o.user.name}</p>
                      <p className="text-xs text-gray-500">{o.user.email}</p>
                    </td>
                    <td className="py-3 text-xs">{o.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}</td>
                    <td className="py-3 font-medium">${Number(o.total).toFixed(2)}</td>
                    <td className="py-3">
                      <select value={o.status} onChange={(e) => updateStatus(o.id, 'status', e.target.value)} className="rounded border p-1 text-xs">
                        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-3">
                      <select value={o.paymentStatus} onChange={(e) => updateStatus(o.id, 'paymentStatus', e.target.value)} className="rounded border p-1 text-xs">
                        {paymentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-3 text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
