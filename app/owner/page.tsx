'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { LogOut, Package, Plus, ShieldCheck } from 'lucide-react';

export default function OwnerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    kategori: '',
    harga: '',
    stok: '',
    stok_minimum: '5',
  });
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Gagal memuat produk', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        nama: formData.nama,
        kategori: formData.kategori,
        harga: parseFloat(formData.harga),
        stok: parseInt(formData.stok),
        stok_minimum: parseInt(formData.stok_minimum),
      });
      setShowModal(false);
      setFormData({ nama: '', kategori: '', harga: '', stok: '', stok_minimum: '5' });
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menambah produk');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Memuat Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* Navbar */}
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-blue-600" size={28} />
            <div>
              <h1 className="text-lg font-bold">Dashboard Owner</h1>
              <p className="text-xs text-gray-500">Selamat datang, {user?.nama}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Manajemen Produk</h2>
            <p className="text-sm text-gray-500">Kelola katalog produk dan stok toko</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
          >
            <Plus size={18} /> Tambah Produk
          </button>
        </div>

        {/* Tabel Produk */}
        <div className="overflow-hidden rounded-xl bg-white shadow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <th className="px-6 py-4">Nama Produk</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4">Stok</th>
                <th className="px-6 py-4">Status Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Belum ada produk tersedia.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      <Package size={16} className="text-gray-400" /> {p.nama}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{p.kategori || '-'}</td>
                    <td className="px-6 py-4 font-semibold">Rp {p.harga.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">{p.stok}</td>
                    <td className="px-6 py-4">
                      {p.stok <= p.stok_minimum ? (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                          Menipis
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600">
                          Aman
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal Tambah Produk */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Tambah Produk Baru</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Contoh: Es Teh Manis"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Contoh: Minuman"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.harga}
                    onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="5000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    required
                    value={formData.stok}
                    onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Batas Minimum Stok</label>
                  <input
                    type="number"
                    required
                    value={formData.stok_minimum}
                    onChange={(e) => setFormData({ ...formData, stok_minimum: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="5"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}