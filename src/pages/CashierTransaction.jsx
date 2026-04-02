// src/pages/CashierTransaction.jsx
import React, { useState, useEffect, useCallback } from 'react'; // <-- TAMBAHKAN useCallback
import { useNavigate } from 'react-router-dom';
import './CashierTransaction.css';

function CashierTransaction() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(0);
  const [change, setChange] = useState(0);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // ============ PERBAIKAN 1: Gunakan useCallback untuk fetchProducts ============
  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []); // Tidak ada dependency karena tidak menggunakan state/props

  // ============ PERBAIKAN 2: Tambahkan dependency yang benar ============
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (user.role !== 'kasir' && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchProducts();
  }, [navigate, user.role, fetchProducts]); // <-- TAMBAHKAN DEPENDENCY

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert('Stok produk habis!');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('Stok tidak mencukupi!');
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId);
    if (newQuantity > product.stock) {
      alert('Stok tidak mencukupi!');
      return;
    }
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handlePaymentChange = (e) => {
    const paymentValue = parseFloat(e.target.value) || 0;
    setPayment(paymentValue);
    setChange(paymentValue - calculateTotal());
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Keranjang masih kosong!');
      return;
    }

    if (payment < calculateTotal()) {
      alert('Pembayaran kurang!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      for (const item of cart) {
        await fetch(`http://localhost:5000/api/products/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...item,
            stock: item.stock - item.quantity
          })
        });
      }

      alert(`Transaksi berhasil!\nTotal: Rp ${calculateTotal().toLocaleString()}\nKembalian: Rp ${change.toLocaleString()}`);
      
      setCart([]);
      setPayment(0);
      setChange(0);
      fetchProducts();
    } catch (error) {
      console.error('Error processing transaction:', error);
      alert('Gagal memproses transaksi');
    }
  };

  const formatRupiah = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="cashier-transaction">
      <header className="transaction-header">
        <h1>🛒 Transaksi Kasir</h1>
        <div className="user-info">
          <span>Kasir: <strong>{user.name}</strong></span>
          <button onClick={() => navigate('/cashier')} className="btn-back">
            Kembali ke Dashboard
          </button>
        </div>
      </header>

      <div className="transaction-container">
        <div className="products-panel">
          <div className="search-box">
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-item" onClick={() => addToCart(product)}>
                <img 
                  src={product.image_url || 'https://via.placeholder.com/100'} 
                  alt={product.name}
                />
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p className="product-price">{formatRupiah(product.price)}</p>
                  <p className={`product-stock ${product.stock <= 5 ? 'low' : ''}`}>
                    Stok: {product.stock}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-panel">
          <h2>Keranjang Belanja</h2>
          
          <div className="cart-items">
            {cart.length === 0 ? (
              <p className="empty-cart">Keranjang kosong</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p>{formatRupiah(item.price)}</p>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    <button onClick={() => removeFromCart(item.id)} className="btn-remove">×</button>
                  </div>
                  <div className="item-subtotal">
                    {formatRupiah(item.price * item.quantity)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>Total:</span>
              <span className="total-amount">{formatRupiah(calculateTotal())}</span>
            </div>
            
            <div className="payment-section">
              <label>Pembayaran:</label>
              <input
                type="number"
                value={payment}
                onChange={handlePaymentChange}
                placeholder="Masukkan jumlah"
                min="0"
              />
            </div>

            {payment > 0 && (
              <div className="summary-row change">
                <span>Kembalian:</span>
                <span className="change-amount">{formatRupiah(change)}</span>
              </div>
            )}

            <button 
              className="btn-checkout"
              onClick={handleCheckout}
              disabled={cart.length === 0 || payment < calculateTotal()}
            >
              Proses Transaksi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CashierTransaction;