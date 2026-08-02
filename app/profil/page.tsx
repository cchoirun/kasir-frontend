'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, UserCircle, Key, Camera, Save } from 'lucide-react';

export default function ProfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama: '', no_telepon: '', foto_profil: '', old_password: '', new_password: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return router.push('/');
    const user = JSON.parse(storedUser);
    setFormData(prev => ({ ...prev, nama: user.nama || '', no_telepon: user.no_telepon || '', foto_profil: user.foto_profil || '' }));
  }, [router]);

  // Mengubah gambar menjadi format Base64 Text
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, foto_profil: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', formData);
      localStorage.setItem('user', JSON.stringify(res.data.user)); // Update data lokal
      alert('Profil berhasil diperbarui!');
      setFormData(prev => ({ ...prev, old_password: '', new_password: '' })); // Reset field password
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal menyimpan profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border p-6 md:p-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition">
          <ArrowLeft size={18} /> Kembali
        </button>

        <h1 className="text-2xl font-bold mb-8 flex items-center gap-2"><UserCircle className="text-blue-600" /> Pengaturan Profil Akun</h1>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start border-b pb-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center">
                {formData.foto_profil ? (
                  <img src={formData.foto_profil} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle size={80} className="text-gray-300" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 shadow-md">
                <Camera size={18} />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
            
            <div className="flex-1 space-y-4 w-full">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                <input type="text" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full p-2.5 rounded-lg border focus:ring-1 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor Telepon</label>
                <input type="text" value={formData.no_telepon} onChange={e => setFormData({...formData, no_telepon: e.target.value})} className="w-full p-2.5 rounded-lg border focus:ring-1 focus:ring-blue-500 outline-none" placeholder="0812xxxxxx" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Key size={18} className="text-gray-500" /> Ganti Password <span className="text-xs font-normal text-gray-400">(Opsional)</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password Lama</label>
                <input type="password" value={formData.old_password} onChange={e => setFormData({...formData, old_password: e.target.value})} className="w-full p-2.5 rounded-lg border focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Kosongkan jika tidak ingin ganti" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password Baru</label>
                <input type="password" value={formData.new_password} onChange={e => setFormData({...formData, new_password: e.target.value})} className="w-full p-2.5 rounded-lg border focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Kosongkan jika tidak ingin ganti" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button type="submit" disabled={loading} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50">
              <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}