'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { LogOut, Package, Plus, ShieldCheck, TrendingUp, CreditCard } from 'lucide-react';

export default function OwnerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_omzet: 0, total_transaksi: 0 });
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
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'owner') {
      router.push('/kasir'); // Cegah kasir masuk ke dashboard owner
      return;
    }
    setUser(parsedUser);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      // Ambil data produk dan analitik secara bersamaan
      const [resProducts, resStats] = await Promise.all([
        api.get('/products'),
        api.get('/analytics/dashboard')
      ]);
      setProducts(resProducts.data.products || []);
      setStats({
        total_omzet: resStats.data.total_omzet || 0,
        total_transaksi: resStats.data.total_transaksi || 0,
      });
    } catch (err) {
      console.error('Gagal memuat data dashboard', err);
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
      fetchData();
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
        
        {/* Widget Analitik */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Omzet Penjualan</p>
              <h3 className="text-2xl font-bold text-gray-900">Rp {stats.total_omzet.toLocaleString('id-ID')}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <CreditCard size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Transaksi Sukses</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.total_transaksi} <span className="text-sm font-normal text-gray-400">pesanan</span></h3>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Katalog & Stok Toko</h2>
            <p className="text-sm text-gray-500">Pantau pergerakan stok barang</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
          >
            <Plus size={18} /> Tambah Produk
          </button>
        </div>

        {/* Tabel Produk */}
        <div className="overflow-hidden rounded-xl bg-white shadow border border-gray-100">
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
            <tbody className="divide-y divide-gray-100 text-sm">
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
                    <td className="px-6 py-4 text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs uppercase tracking-wide">{p.kategori || '-'}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">Rp {p.harga.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 font-mono">{p.stok}</td>
                    <td className="px-6 py-4">
                      {p.stok <= p.stok_minimum ? (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 border border-red-200">
                          Menipis
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-200">
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

      {/* Modal Tambah Produk (Sama persis seperti sebelumnya) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Tambah Produk Baru</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Nama Produk</label>
                <input type="text" required value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Contoh: Kopi Susu" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Kategori</label>
                  <input type="text" value={formData.kategori} onChange={(e) => setFormData({ ...formData, kategori: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Minuman" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Harga (Rp)</label>
                  <input type="number" required value={formData.harga} onChange={(e) => setFormData({ ...formData, harga: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="5000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Stok Awal</label>
                  <input type="number" required value={formData.stok} onChange={(e) => setFormData({ ...formData, stok: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Batas Minimum Stok</label>
                  <input type="number" required value={formData.stok_minimum} onChange={(e) => setFormData({ ...formData, stok_minimum: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="5" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300">Batal</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Simpan Produk</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}