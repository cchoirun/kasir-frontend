'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { LogOut, Package, Plus, ShieldCheck, TrendingUp, CreditCard, Award, ArrowRight, Users, Pencil, UserCircle, Trash2 } from 'lucide-react';

export default function OwnerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_omzet: 0, total_transaksi: 0, top_products: [] });
  const [loading, setLoading] = useState(true);
  
  // State untuk Modal Form (Tambah & Edit)
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    kategori: '',
    harga: '',
    stok: '',
    stok_minimum: '5',
    foto_produk: '', 
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
      router.push('/kasir');
      return;
    }
    setUser(parsedUser);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [resProducts, resStats] = await Promise.all([
        api.get('/products'),
        api.get('/analytics/dashboard')
      ]);
      setProducts(resProducts.data.data || []);
      setStats({
        total_omzet: resStats.data.total_omzet || 0,
        total_transaksi: resStats.data.total_transaksi || 0,
        top_products: resStats.data.top_products || [],
      });
    } catch (err) {
      console.error('Gagal memuat data dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, foto_produk: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ 
      nama: '', 
      kategori: '', 
      harga: '', 
      stok: '', 
      stok_minimum: '5', 
      foto_produk: '' 
    });
    setShowModal(true);
  };

  const openEditModal = (p: any) => {
    setIsEditing(true);
    setEditId(p.id);
    setFormData({
      nama: p.nama,
      kategori: p.kategori,
      harga: p.harga.toString(),
      stok: p.stok.toString(),
      stok_minimum: p.stok_minimum.toString(),
      foto_produk: p.foto_produk || '',
    });
    setShowModal(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nama: formData.nama,
        kategori: formData.kategori,
        harga: parseFloat(formData.harga),
        stok: parseInt(formData.stok),
        stok_minimum: parseInt(formData.stok_minimum),
        foto_produk: formData.foto_produk,
      };

      if (isEditing && editId) {
        await api.put(`/products/${editId}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menyimpan produk');
    }
  };

  const handleDeleteProduct = async (id: number, nama: string) => {
  const result = await Swal.fire({
    title: 'Hapus Produk?',
    text: `Yakin ingin menghapus ${nama} dari katalog?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#9ca3af',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  });

  if (result.isConfirmed) {
    try {
      await api.delete(`/products/${id}`);
      fetchData(); // Refresh tabel dan analitik
      Swal.fire({
        title: 'Terhapus!',
        text: 'Produk berhasil dihapus.',
        icon: 'success',
        confirmButtonColor: '#2563eb',
      });
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal',
        text: err.response?.data?.error || 'Gagal menghapus produk',
        icon: 'error',
        confirmButtonColor: '#2563eb',
      });
    }
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
      <header className="bg-white shadow">
        <div className="mx-auto flex flex-col md:flex-row max-w-7xl items-center justify-between px-4 lg:px-6 py-4 gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
            <ShieldCheck className="text-blue-600" size={28} />
            <div>
              <h1 className="text-lg font-bold">Dashboard Owner</h1>
              <p className="text-xs text-gray-500">Selamat datang, {user?.nama}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
            <button
              onClick={() => router.push('/profil')}
              className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs lg:text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
            >
              <UserCircle size={16} /> Profil
            </button>
            <button
              onClick={() => router.push('/owner/pegawai')}
              className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs lg:text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
            >
              <Users size={16} /> Pegawai
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs lg:text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        
        {/* Widget Analitik Utama */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Omzet Pendapatan</p>
              <h3 className="text-2xl font-bold text-gray-900">Rp {stats.total_omzet.toLocaleString('id-ID')}</h3>
            </div>
          </div>
          
          <div 
            onClick={() => router.push('/riwayat')}
            className="group flex cursor-pointer items-center justify-between rounded-2xl bg-white p-6 shadow-sm border border-gray-100 transition hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <CreditCard size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Transaksi Sukses</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.total_transaksi} <span className="text-sm font-normal text-gray-400">pesanan</span></h3>
              </div>
            </div>
            <ArrowRight className="text-gray-300 group-hover:text-blue-500 transition" size={24} />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 row-span-2">
            <div className="flex items-center gap-2 mb-4 text-orange-600 font-bold">
              <Award size={20} /> <h3>5 Produk Terlaris</h3>
            </div>
            <div className="space-y-4">
              {stats.top_products.length === 0 ? (
                <p className="text-sm text-gray-400">Belum ada data penjualan.</p>
              ) : (
                stats.top_products.map((tp: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-gray-700">{tp.nama}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900">{tp.terjual} x</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tabel Katalog & Stok Toko */}
          <div className="md:col-span-2 rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-bold">Katalog & Stok Toko</h2>
                <p className="text-xs text-gray-500">Pantau pergerakan stok barang</p>
              </div>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
              >
                <Plus size={16} /> Tambah Produk
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                    <th className="px-6 py-4">Nama Produk</th>
                    <th className="px-6 py-4">Harga</th>
                    <th className="px-6 py-4">Stok</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {products.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Belum ada produk.</td></tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        
                        <td className="px-6 py-4 font-medium flex items-center gap-3">
                          {p.foto_produk ? (
                            <img src={p.foto_produk} alt={p.nama} className="w-8 h-8 rounded object-cover border" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center border">
                              <Package size={14} className="text-gray-400" />
                            </div>
                          )}
                          {p.nama}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-800">Rp {p.harga.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 font-mono">{p.stok}</td>
                        <td className="px-6 py-4">
                          {p.stok <= p.stok_minimum ? (
                            <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold text-red-600 uppercase border border-red-200">Menipis</span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600 uppercase border border-emerald-200">Aman</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openEditModal(p)} 
                            className="p-2 text-blue-500 hover:bg-blue-50 hover:text-blue-700 rounded transition"
                            title="Edit Produk"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p.id, p.nama)} 
                            className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded transition"
                            title="Hapus Produk"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Tambah / Edit Produk */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">{isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50">
                  {formData.foto_produk ? (
                    <img src={formData.foto_produk} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Package size={32} className="text-gray-300" />
                  )}
                </div>
                <label className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700">
                  + Pilih Foto Tas
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Nama Produk</label>
                <input type="text" required value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Contoh: Tas Ransel" />
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
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Stok Tersedia</label>
                  <input type="number" required value={formData.stok} onChange={(e) => setFormData({ ...formData, stok: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Batas Minimum Stok</label>
                  <input type="number" required value={formData.stok_minimum} onChange={(e) => setFormData({ ...formData, stok_minimum: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="5" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300">Batal</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  {isEditing ? 'Simpan Perubahan' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}