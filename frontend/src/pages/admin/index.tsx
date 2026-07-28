import { useEffect, useState } from 'react';
import AdminGuard from '@/components/AdminGuard';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/products?limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
      api.get('/orders/admin/all?limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
      api.get('/admin/users').catch(() => ({ data: [] })),
    ]).then(([products, orders, users]) => {
      setStats({
        products: products.data.pagination?.total || 0,
        orders: orders.data.pagination?.total || 0,
        users: users.data.length || 0,
        revenue: 0,
      });
    });
  }, []);

  return (
    <AdminGuard>
      <AdminLayout>
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Products', value: stats.products, color: 'bg-blue-500' },
            { label: 'Total Orders', value: stats.orders, color: 'bg-green-500' },
            { label: 'Total Users', value: stats.users, color: 'bg-purple-500' },
            { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, color: 'bg-orange-500' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
              <div className={`mb-2 h-3 w-3 rounded-full ${card.color}`} />
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
