'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ShoppingCart, LogOut, Trash2, Plus, Minus, QrCode, CheckCircle2, Search, History } from 'lucide-react';

export default function KasirPage() {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(''); // State untuk fitur pencarian
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // State untuk Modal QRIS
  const [modalQR, setModalQR] = useState(false);
  const [qrisData, setQrisData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
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

  // Logika Pencarian Barang (Filter)
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
          alert('Jumlah melebihi stok yang tersedia!');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);
  const finalTotal = subtotal - discount > 0 ? subtotal - discount : 0;

  const handleCheckout = async (metode: 'tunai' | 'qris') => {
    if (cart.length === 0) {
      alert('Keranjang masih kosong');
      return;
    }

    try {
      const payload = {
        metode_bayar: metode,
        discount: discount,
        items: cart.map(item => ({
          product_id: item.id,
          qty: item.qty
        }))
      };

      const res = await api.post('/transactions', payload);
      const transaction = res.data.transaction;

      if (metode === 'tunai') {
        alert('Transaksi Tunai Berhasil Disimpan & Lunas!');
        setCart([]);
        setDiscount(0);
        fetchProducts(); // Refresh stok dari backend
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
      await api.post('/webhooks/payment', {
        qris_reference_id: qrisData.qris_reference_id
      });
      setPaymentStatus('lunas');
      setCart([]);
      setDiscount(0);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal simulasi pembayaran');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Memuat POS Kasir...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 overflow-hidden">
      {/* Sisi Kiri: List Produk & Pencarian */}
      <div className="flex-1 flex flex-col h-full border-r border-gray-200">
        {/* Header POS */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-lg font-bold">Kasir POS</h1>
            <p className="text-xs text-gray-500">Petugas: {user?.nama}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/riwayat')}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
            >
              <History size={14} /> Riwayat
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
            >
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </header>

        {/* Toolbar Pencarian */}
        <div className="bg-white p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama atau kategori produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
            />
          </div>
        </div>

        {/* List Produk (Bentuk Baris/Daftar) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center text-gray-400 mt-10 text-sm">Produk tidak ditemukan.</div>
          ) : (
            filteredProducts.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-4 rounded-xl border bg-white shadow-sm transition hover:shadow-md ${
                  p.stok <= 0 ? 'opacity-60 bg-gray-50' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-blue-600 mb-1 tracking-wider">
                    {p.kategori || 'Umum'}
                  </span>
                  <span className="font-semibold text-gray-800 text-sm md:text-base">{p.nama}</span>
                  <span className="text-xs mt-1 text-gray-500">
                    Sisa Stok:{' '}
                    <span className={`font-bold ${p.stok <= p.stok_minimum ? 'text-red-500' : 'text-green-600'}`}>
                      {p.stok}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-900">Rp {p.harga.toLocaleString('id-ID')}</span>
                  <button
                    onClick={() => addToCart(p)}
                    disabled={p.stok <= 0}
                    className={`p-2 rounded-lg transition ${
                      p.stok <= 0 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sisi Kanan: Keranjang & Checkout (Tetap Sama) */}
      <div className="w-[400px] bg-white flex flex-col h-full shadow-lg z-10">
        <div className="p-4 border-b flex items-center gap-2 font-bold text-gray-800">
          <ShoppingCart size={20} /> Keranjang Belanja
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-gray-100">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
              <ShoppingCart size={40} className="mb-2 stroke-1" />
              <p className="text-sm">Keranjang masih kosong</p>
              <p className="text-xs">Klik tombol [+] di kiri untuk menambahkan</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between">
                <div className="flex-1 pr-2">
                  <h4 className="text-sm font-semibold text-gray-800">{item.nama}</h4>
                  <p className="text-xs text-gray-500">Rp {item.harga.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, -1)} className="rounded bg-gray-100 p-1 hover:bg-gray-200">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-semibold w-5 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="rounded bg-gray-100 p-1 hover:bg-gray-200">
                    <Plus size={14} />
                  </button>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 ml-2">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Diskon (Rp)</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
              className="w-28 rounded border border-gray-300 p-1.5 text-right text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="0"
            />
          </div>
          <div className="flex justify-between text-base font-bold border-t pt-2">
            <span>Total Akhir</span>
            <span className="text-blue-600">Rp {finalTotal.toLocaleString('id-ID')}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => handleCheckout('tunai')}
              className="rounded-lg bg-emerald-600 py-3 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition"
            >
              Bayar Tunai
            </button>
            <button
              onClick={() => handleCheckout('qris')}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-3 text-xs font-semibold text-white shadow hover:bg-blue-700 transition"
            >
              <QrCode size={16} /> Bayar QRIS
            </button>
          </div>
        </div>
      </div>

      {/* Modal QRIS (Tetap Sama) */}
      {modalQR && qrisData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-gray-800">Scan QRIS</h3>
            <p className="text-xs text-gray-500 mb-4">Arahkan m-banking / e-wallet</p>
            <div className="my-4 flex justify-center bg-gray-50 p-4 rounded-xl border">
              <img src={qrisData.qr_image_url} alt="QRIS Code" className="w-56 h-56 object-contain" />
            </div>
            <p className="text-sm font-bold text-gray-800">Total: Rp {qrisData.total_amount.toLocaleString('id-ID')}</p>
            <p className="text-[10px] text-gray-400 mt-1">Ref ID: {qrisData.qris_reference_id}</p>

            {paymentStatus === 'lunas' ? (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-50 p-3 text-green-700 font-semibold text-sm border border-green-200">
                <CheckCircle2 size={18} /> Pembayaran Lunas!
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <button
                  onClick={simulatePaymentSuccess}
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                >
                  [Simulasi] Sukses Bayar
                </button>
                <button
                  onClick={() => setModalQR(false)}
                  className="w-full rounded-lg bg-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-300 transition"
                >
                  Tutup
                </button>
              </div>
            )}
            {paymentStatus === 'lunas' && (
              <button
                onClick={() => setModalQR(false)}
                className="mt-3 w-full rounded-lg bg-gray-800 py-2 text-xs font-semibold text-white hover:bg-gray-900 transition"
              >
                Selesai
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}