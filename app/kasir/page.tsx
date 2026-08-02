'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ShoppingCart, LogOut, Trash2, Plus, Minus, QrCode, CheckCircle2, Search, History, Printer, X, Key, UserCircle } from 'lucide-react';

export default function KasirPage() {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // State untuk berbagai Modal
  const [modalQR, setModalQR] = useState(false);
  const [qrisData, setQrisData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [receiptData, setReceiptData] = useState<any>(null);
  
  // State Khusus Ubah Password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdData, setPwdData] = useState({ old_password: '', new_password: '' });

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

  const filteredProducts = products.filter((p) => 
    p.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.kategori && p.kategori.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addToCart = (product: any) => {
    if (product.stok <= 0) {
      alert('Stok produk habis!');
      return;
    }
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stok) {
          alert('Jumlah melebihi stok!');
          return prevCart;
        }
        return prevCart.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        }).filter(Boolean);
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
  const finalTotal = subtotal - discount > 0 ? subtotal - discount : 0;

  const handleTransactionSuccess = (metode: string, transactionId: number, refId?: string) => {
    setReceiptData({
      id: transactionId,
      metode: metode,
      refId: refId || '-',
      items: [...cart],
      subtotal: subtotal,
      discount: discount,
      total: finalTotal,
      tanggal: new Date().toLocaleString('id-ID'),
      kasir: user?.nama || 'Kasir'
    });
    setCart([]);
    setDiscount(0);
    setModalQR(false);
    fetchProducts(); 
  };

  const handleCheckout = async (metode: 'tunai' | 'qris') => {
    if (cart.length === 0) return alert('Keranjang masih kosong');
    try {
      const payload = {
        metode_bayar: metode,
        discount: discount,
        items: cart.map(item => ({ product_id: item.id, qty: item.qty }))
      };
      const res = await api.post('/transactions', payload);
      const transaction = res.data.transaction;

      if (metode === 'tunai') {
        handleTransactionSuccess('tunai', transaction.id);
      } else {
        const qrisRes = await api.get(`/transactions/${transaction.id}/qris`);
        setQrisData(qrisRes.data);
        setPaymentStatus('pending');
        setModalQR(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal memproses transaksi');
    }
  };

  const simulatePaymentSuccess = async () => {
    if (!qrisData) return;
    try {
      await api.post('/webhooks/payment', { qris_reference_id: qrisData.qris_reference_id });
      handleTransactionSuccess('qris', qrisData.transaction_id, qrisData.qris_reference_id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal simulasi pembayaran');
    }
  };

  // Fungsi Ganti Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/auth/change-password', pwdData);
      alert('Password berhasil diperbarui! Silakan gunakan password baru pada login berikutnya.');
      setShowPasswordModal(false);
      setPwdData({ old_password: '', new_password: '' });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal mengubah password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Memuat POS...</div>;
  }

  return (
    <>
      <div className="flex h-screen bg-gray-100 text-gray-900 overflow-hidden print:hidden">
        
        <div className="flex-1 flex flex-col h-full border-r border-gray-200">
          <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
            <div>
              <h1 className="text-lg font-bold">Kasir POS</h1>
              <p className="text-xs text-gray-500">Petugas: {user?.nama}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/riwayat')}
                className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                <History size={14} /> Riwayat
              </button>
              <button onClick={() => router.push('/profil')} className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100">
                  <UserCircle size={14} /> Profil
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
              >
                <LogOut size={14} /> Keluar
              </button>
            </div>
          </header>

          <div className="bg-white p-4 border-b border-gray-100">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
            {filteredProducts.map((p) => (
              <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border bg-white shadow-sm transition hover:shadow-md ${p.stok <= 0 ? 'opacity-60 bg-gray-50' : 'border-gray-200'}`}>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-blue-600 mb-1">{p.kategori || 'Umum'}</span>
                  <span className="font-semibold text-gray-800 text-sm">{p.nama}</span>
                  <span className="text-xs mt-1 text-gray-500">Stok: <span className={p.stok <= p.stok_minimum ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>{p.stok}</span></span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-900">Rp {p.harga.toLocaleString('id-ID')}</span>
                  <button onClick={() => addToCart(p)} disabled={p.stok <= 0} className={`p-2 rounded-lg transition ${p.stok <= 0 ? 'bg-gray-200 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}>
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-[400px] bg-white flex flex-col h-full shadow-lg z-10">
          <div className="p-4 border-b flex items-center gap-2 font-bold text-gray-800">
            <ShoppingCart size={20} /> Keranjang Belanja
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-gray-100">
            {cart.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between">
                <div className="flex-1 pr-2">
                  <h4 className="text-sm font-semibold text-gray-800">{item.nama}</h4>
                  <p className="text-xs text-gray-500">Rp {item.harga.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, -1)} className="rounded bg-gray-100 p-1 hover:bg-gray-200"><Minus size={14} /></button>
                  <span className="text-sm font-semibold w-5 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="rounded bg-gray-100 p-1 hover:bg-gray-200"><Plus size={14} /></button>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 ml-2"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t bg-gray-50 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Diskon (Rp)</span>
              <input type="number" value={discount} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))} className="w-28 rounded border border-gray-300 p-1.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0" />
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-2">
              <span>Total Akhir</span>
              <span className="text-blue-600">Rp {finalTotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={() => handleCheckout('tunai')} className="rounded-lg bg-emerald-600 py-3 text-xs font-semibold text-white shadow hover:bg-emerald-700">Bayar Tunai</button>
              <button onClick={() => handleCheckout('qris')} className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-3 text-xs font-semibold text-white shadow hover:bg-blue-700"><QrCode size={16} /> Bayar QRIS</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal QRIS Pending */}
      {modalQR && qrisData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-gray-800">Scan QRIS</h3>
            <p className="text-xs text-gray-500 mb-4">Arahkan m-banking / e-wallet</p>
            <div className="my-4 flex justify-center bg-gray-50 p-4 rounded-xl border">
              <img src={qrisData.qr_image_url} alt="QRIS Code" className="w-56 h-56 object-contain" />
            </div>
            <p className="text-sm font-bold text-gray-800">Total: Rp {qrisData.total_amount.toLocaleString('id-ID')}</p>
            
            <div className="mt-4 space-y-2">
              <button onClick={simulatePaymentSuccess} className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition">
                [Simulasi] Sukses Bayar
              </button>
              <button onClick={() => setModalQR(false)} className="w-full rounded-lg bg-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-300 transition">
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ubah Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold flex items-center gap-2"><Key size={20} className="text-blue-600"/> Ganti Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Password Lama</label>
                <input type="password" required value={pwdData.old_password} onChange={(e) => setPwdData({ ...pwdData, old_password: e.target.value })} className="w-full rounded-lg border p-2.5 text-sm focus:ring-1 focus:ring-blue-500" placeholder="Masukkan password saat ini" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Password Baru</label>
                <input type="password" required value={pwdData.new_password} onChange={(e) => setPwdData({ ...pwdData, new_password: e.target.value })} className="w-full rounded-lg border p-2.5 text-sm focus:ring-1 focus:ring-blue-500" placeholder="Buat password baru" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">Batal</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Simpan Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL STRUK DIGITAL */}
      {receiptData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm print:static print:bg-white print:flex print:justify-start print:p-0 print:m-0">
          
          {/* Injeksi CSS Khusus Printer Thermal */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page {
                margin: 0; /* Menghilangkan margin bawaan kertas */
                size: 80mm auto; /* Mengatur ukuran kertas jadi 80mm (standar thermal) */
              }
              body {
                -webkit-print-color-adjust: exact;
              }
            }
          `}} />

          {/* Wrapper Struk - Lebar dikunci ke ukuran struk saat diprint */}
          <div className="w-full max-w-[320px] rounded-2xl bg-white p-6 shadow-2xl print:w-[80mm] print:max-w-[80mm] print:shadow-none print:p-2 print:rounded-none print:m-0">
            
            <div className="font-mono text-sm text-black">
              <div className="text-center mb-4 border-b border-dashed border-gray-400 pb-3">
                <h2 className="text-base font-bold uppercase">Aplikasi Kasir QRIS</h2>
                <p className="text-[11px] text-gray-600">Jl. Keputih No. 123, Surabaya</p>
                <p className="text-[11px] text-gray-600">Telp: 0812-3456-7890</p>
              </div>
              
              <div className="border-b border-dashed border-gray-400 pb-2 mb-3 text-xs space-y-0.5">
                <div className="flex justify-between"><span className="text-gray-500">Waktu:</span> <span>{receiptData.tanggal}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Kasir:</span> <span>{receiptData.kasir}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Metode:</span> <span className="uppercase font-bold">{receiptData.metode}</span></div>
                {receiptData.metode === 'qris' && (
                  <div className="flex justify-between"><span className="text-gray-500">Ref ID:</span> <span className="truncate ml-2">{receiptData.refId}</span></div>
                )}
              </div>

              <div className="space-y-2 text-xs mb-3">
                {receiptData.items.map((item: any, idx: number) => (
                  <div key={idx}>
                    <div className="font-semibold text-gray-800">{item.nama}</div>
                    <div className="flex justify-between text-gray-600">
                      <span>{item.qty} x {item.harga.toLocaleString('id-ID')}</span>
                      <span>{(item.qty * item.harga).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-400 pt-2 text-xs space-y-1">
                <div className="flex justify-between text-gray-600"><span>Subtotal:</span> <span>{receiptData.subtotal.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-gray-600"><span>Diskon:</span> <span>- {receiptData.discount.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between font-bold text-sm mt-1 border-t border-gray-300 pt-1 text-black">
                  <span>TOTAL:</span> <span>Rp {receiptData.total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="text-center text-[11px] text-gray-500 mt-6 pt-2 border-t border-gray-200">
                <p>Terima Kasih atas Kunjungan Anda!</p>
                <p className="text-[10px]">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
              </div>
            </div>

            <div className="mt-8 flex gap-3 print:hidden">
              <button 
                onClick={() => setReceiptData(null)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-300"
              >
                <X size={16} /> Tutup
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Printer size={16} /> Cetak Struk
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}