'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import api from '@/lib/api';
import { ArrowLeft, Users, Plus, Trash2 } from 'lucide-react';

export default function PegawaiPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nama: '', username: '', password: '' });
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Gagal memuat kasir', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', formData);
      setShowModal(false);
      setFormData({ nama: '', username: '', password: '' });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menambah kasir');
    }
  };

 const handleDelete = async (id: number, nama: string) => {
    // Memunculkan pop-up konfirmasi yang modern
    const result = await Swal.fire({
      title: 'Hapus Akun?',
      text: `Yakin ingin menghapus akun kasir: ${nama}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626', // Warna red-600 Tailwind untuk tombol bahaya
      cancelButtonColor: '#9ca3af',  // Warna gray-400 Tailwind untuk tombol batal
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    // Jika user menekan tombol "Ya, Hapus!"
    if (result.isConfirmed) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers(); // Menyegarkan data tabel
        
        // Menampilkan pop-up sukses
        Swal.fire({
          title: 'Terhapus!',
          text: 'Akun kasir berhasil dihapus.',
          icon: 'success',
          confirmButtonColor: '#2563eb', // Warna blue-600 Tailwind
        });
      } catch (err) {
        // Menampilkan pop-up error jika API gagal
        Swal.fire({
          title: 'Gagal',
          text: 'Terjadi kesalahan saat menghapus kasir.',
          icon: 'error',
          confirmButtonColor: '#2563eb',
        });
      }
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50">Memuat data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Users size={20} className="text-blue-600"/> Manajemen Pegawai</h1>
            <p className="text-xs text-gray-500">Kelola akun akses untuk kasir toko</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          <Plus size={18} /> Tambah Kasir
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Username Login</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Belum ada akun kasir terdaftar.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-800">{u.nama}</td>
                    <td className="px-6 py-4 font-mono text-blue-600">{u.username}</td>
                    <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold uppercase">{u.role}</span></td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleDelete(u.id, u.nama)} className="text-red-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal Tambah Pegawai */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Daftarkan Akun Kasir</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Lengkap (Sesuai KTP)</label>
                <input type="text" required value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="w-full rounded-lg border p-2.5 text-sm focus:ring-1 focus:ring-blue-500" placeholder="Contoh: Budi Santoso" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Username Login</label>
                <input type="text" required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })} className="w-full rounded-lg border p-2.5 text-sm focus:ring-1 focus:ring-blue-500" placeholder="Contoh: kasir_budi" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full rounded-lg border p-2.5 text-sm focus:ring-1 focus:ring-blue-500" placeholder="••••••••" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">Batal</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Simpan Akun</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}