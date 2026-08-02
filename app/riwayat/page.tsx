'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Clock, CheckCircle2, FileSpreadsheet, Eye, Printer, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null); // State untuk modal detail struk
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

  const handleExportExcel = () => {
    if (transactions.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor!');
      return;
    }

    const dataToExport = transactions.map((t, index) => ({
      'No': index + 1,
      'Waktu Transaksi': new Date(t.created_at).toLocaleString('id-ID'),
      'Referensi / ID': t.qris_reference_id || `TRX-TUNAI-${t.id}`,
      'Kasir': t.kasir?.nama || '-',
      'Metode Bayar': t.metode_bayar.toUpperCase(),
      'Status': t.status.toUpperCase(),
      'Total Pendapatan (Rp)': t.total_amount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Transaksi');

    const dateToday = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Laporan_Penjualan_${dateToday}.xlsx`);
  };

  // Fungsi untuk membuka modal detail struk dari data transaksi yang dipilih
  const openReceiptModal = (t: any) => {
    setSelectedReceipt({
      id: t.id,
      metode: t.metode_bayar,
      refId: t.qris_reference_id || '-',
      items: t.items || [],
      subtotal: t.total_amount + (t.discount || 0),
      discount: t.discount || 0,
      total: t.total_amount,
      tanggal: new Date(t.created_at).toLocaleString('id-ID'),
      kasir: t.kasir?.nama || 'Kasir',
    });
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50">Memuat Riwayat...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Riwayat Transaksi</h1>
            <p className="text-xs text-gray-500">Daftar seluruh transaksi penjualan dan detail struk</p>
          </div>
        </div>
        
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
        >
          <FileSpreadsheet size={18} />
          Export Excel
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 print:hidden">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden print:border-none print:shadow-none">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500 print:hidden">
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Ref / ID</th>
                <th className="px-6 py-4">Kasir</th>
                <th className="px-6 py-4">Metode</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400">Belum ada transaksi tercatat.</td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {new Date(t.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">
                      {t.qris_reference_id || `TRX-${t.id}`}
                    </td>
                    <td className="px-6 py-4 font-medium text-xs text-gray-800">
                      {t.kasir?.nama || '-'}
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
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openReceiptModal(t)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-600 hover:text-white transition"
                      >
                        <Eye size={14} /> Detail Struk
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL DETAIL / STRUK DIGITAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm print:static print:bg-white print:flex print:justify-start print:p-0 print:m-0">
          
          {/* Injeksi CSS Khusus Printer Thermal */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page {
                margin: 0; /* Menghilangkan margin bawaan kertas */
                size: 80mm auto; /* Mengatur ukuran kertas jadi 80mm */
              }
              body {
                -webkit-print-color-adjust: exact;
              }
            }
          `}} />

          {/* Wrapper Struk - Lebar dikunci ke ukuran struk saat diprint */}
          <div className="w-full max-w-[340px] rounded-2xl bg-white p-6 shadow-2xl print:w-[80mm] print:max-w-[80mm] print:shadow-none print:p-2 print:rounded-none print:m-0">
            
            {/* Tampilan Struk Thermal */}
            <div className="font-mono text-sm text-black">
              <div className="text-center mb-4 border-b border-dashed border-gray-400 pb-3">
                <h2 className="text-base font-bold uppercase">Aplikasi Kasir QRIS</h2>
                <p className="text-[11px] text-gray-600">Jl. Keputih No. 123, Surabaya</p>
                <p className="text-[11px] text-gray-600">Telp: 0812-3456-7890</p>
              </div>
              
              <div className="border-b border-dashed border-gray-400 pb-2 mb-3 text-xs space-y-0.5">
                <div className="flex justify-between"><span className="text-gray-500">Waktu:</span> <span>{selectedReceipt.tanggal}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Kasir:</span> <span>{selectedReceipt.kasir}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Metode:</span> <span className="uppercase font-bold">{selectedReceipt.metode}</span></div>
                {selectedReceipt.metode === 'qris' && (
                  <div className="flex justify-between"><span className="text-gray-500">Ref ID:</span> <span className="truncate ml-2">{selectedReceipt.refId}</span></div>
                )}
              </div>

              <div className="space-y-2 text-xs mb-3">
                <p className="font-bold text-[10px] uppercase text-gray-400 tracking-wider">Item Pembelian:</p>
                {selectedReceipt.items.map((item: any, idx: number) => (
                  <div key={idx}>
                    <div className="font-semibold text-gray-800">{item.product?.nama || 'Produk'}</div>
                    <div className="flex justify-between text-gray-600">
                      <span>{item.qty} x {item.harga_satuan.toLocaleString('id-ID')}</span>
                      <span>{item.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-400 pt-2 text-xs space-y-1">
                <div className="flex justify-between text-gray-600"><span>Subtotal:</span> <span>{selectedReceipt.subtotal.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-gray-600"><span>Diskon:</span> <span>- {selectedReceipt.discount.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between font-bold text-sm mt-1 border-t border-gray-300 pt-1 text-black">
                  <span>TOTAL:</span> <span>Rp {selectedReceipt.total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="text-center text-[11px] text-gray-500 mt-6 pt-2 border-t border-gray-200">
                <p>Terima Kasih atas Kunjungan Anda!</p>
                <p className="text-[10px]">Simpan struk ini sebagai bukti pembayaran.</p>
              </div>
            </div>

            {/* Tombol Kontrol Modal (Tersembunyi saat di-print) */}
            <div className="mt-6 flex gap-3 print:hidden">
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-200 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-300 transition"
              >
                <X size={16} /> Tutup
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
              >
                <Printer size={16} /> Cetak Ulang
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}