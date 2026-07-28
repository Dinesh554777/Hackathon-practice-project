import { useEffect, useState } from 'react';
import AdminGuard from '@/components/AdminGuard';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  category: { name: string } | null;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', stock: '0', categoryId: '', description: '' });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const fetch = () => {
    setLoading(true);
    api.get('/products?limit=100')
      .then((res) => setProducts(res.data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch();
    api.get('/categories').then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/products', form);
    setShowForm(false);
    setForm({ name: '', price: '', stock: '0', categoryId: '', description: '' });
    fetch();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await api.put(`/products/${id}`, { isActive: !current });
    fetch();
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await api.put(`/products/${id}`, { isFeatured: !current });
    fetch();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    fetch();
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Products</h1>
          <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700">
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={createProduct} className="mb-8 rounded-xl border border-gray-200 p-6 space-y-4 dark:border-gray-800">
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="text" placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border p-3" required />
              <input type="number" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-lg border p-3" required />
              <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="rounded-lg border p-3" />
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="rounded-lg border p-3">
                <option value="">No Category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border p-3" rows={3} />
            <button type="submit" className="rounded-lg bg-primary-600 px-6 py-2 text-white hover:bg-primary-700">Create Product</button>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Price</th>
                  <th className="pb-3 font-medium">Stock</th>
                  <th className="pb-3 font-medium">Active</th>
                  <th className="pb-3 font-medium">Featured</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="py-3">{p.name}</td>
                    <td className="py-3">${Number(p.price).toFixed(2)}</td>
                    <td className="py-3">{p.stock}</td>
                    <td className="py-3">
                      <button onClick={() => toggleActive(p.id, p.isActive)} className={`rounded-full px-2 py-0.5 text-xs ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3">
                      <button onClick={() => toggleFeatured(p.id, p.isFeatured)} className={`rounded-full px-2 py-0.5 text-xs ${p.isFeatured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isFeatured ? 'Featured' : 'Normal'}
                      </button>
                    </td>
                    <td className="py-3">
                      <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                    </td>
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
