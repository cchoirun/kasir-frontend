'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Clock, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    fetchTransactions();
  }, [router]);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error('Gagal memuat riwayat', err);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk Export ke Excel
  const handleExportExcel = () => {
    if (transactions.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor!');
      return;
    }

    // 1. Format ulang data agar rapi saat dibaca di Excel
    const dataToExport = transactions.map((t, index) => ({
      'No': index + 1,
      'Waktu Transaksi': new Date(t.created_at).toLocaleString('id-ID'),
      'Referensi / ID': t.qris_reference_id || `TRX-TUNAI-${t.id}`,
      'Metode Bayar': t.metode_bayar.toUpperCase(),
      'Status': t.status.toUpperCase(),
      'Total Pendapatan (Rp)': t.total_amount,
    }));

    // 2. Buat Worksheet dan Workbook baru
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Transaksi');

    // 3. Simpan (Download) file Excel
    const dateToday = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Laporan_Penjualan_${dateToday}.xlsx`);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50">Memuat Riwayat...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Riwayat Transaksi</h1>
            <p className="text-xs text-gray-500">Daftar seluruh transaksi penjualan</p>
          </div>
        </div>
        
        {/* Tombol Export Excel */}
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
        >
          <FileSpreadsheet size={18} />
          Export Excel
        </button>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Ref / ID</th>
                <th className="px-6 py-4">Metode</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">Belum ada transaksi tercatat.</td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(t.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">
                      {t.qris_reference_id || `TRX-TUNAI-${t.id}`}
                    </td>
                    <td className="px-6 py-4 uppercase font-semibold text-xs text-gray-700">
                      {t.metode_bayar}
                    </td>
                    <td className="px-6 py-4">
                      {t.status === 'lunas' ? (
                        <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded w-fit text-xs font-bold">
                          <CheckCircle2 size={14} /> Lunas
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit text-xs font-bold">
                          <Clock size={14} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-right text-blue-600">
                      Rp {t.total_amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}