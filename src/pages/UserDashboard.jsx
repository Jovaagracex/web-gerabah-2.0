// src/pages/UserDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './UserDashboard.css';

function UserDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    favoriteCategory: '-'
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.role !== 'user') {
        navigate('/login');
        return;
      }
    }
    
    // Fetch all data
    Promise.all([
      fetchUserStats(),
      fetchRecentProducts()
    ]).finally(() => setLoading(false));
  }, [navigate]);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch user transactions from API
      const response = await fetch('http://localhost:5000/api/user/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const transactions = await response.json();
      console.log('User transactions:', transactions);
      
      // Hitung statistik dari data real
      const totalOrders = transactions.length;
      const totalSpent = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      
      // Hitung kategori favorit (jika ada data)
      let categoryCount = {};
      let favoriteCategory = '-';
      let maxCount = 0;
      
      transactions.forEach(transaction => {
        if (transaction.items && Array.isArray(transaction.items)) {
          transaction.items.forEach(item => {
            // Ambil kategori dari nama produk (sementara)
            // Idealnya ada field category di item
            const words = item.product_name?.split(' ') || [];
            const category = words[0] || 'Umum';
            categoryCount[category] = (categoryCount[category] || 0) + (item.quantity || 1);
          });
        }
      });
      
      Object.entries(categoryCount).forEach(([cat, count]) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteCategory = cat;
        }
      });
      
      setStats({
        totalOrders,
        totalSpent,
        favoriteCategory: totalOrders > 0 ? favoriteCategory : '-'
      });
      
      // Set recent orders (5 terbaru)
      setRecentOrders(transactions.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Jika error, tetap tampilkan 0
      setStats({
        totalOrders: 0,
        totalSpent: 0,
        favoriteCategory: '-'
      });
      setRecentOrders([]);
    }
  };

  const fetchRecentProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setRecentProducts(data.slice(0, 4)); // Ambil 4 produk terbaru
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const formatRupiah = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
  };

  const getMemberSince = () => {
    if (!user?.created_at) return new Date().toLocaleDateString('id-ID');
    return formatDate(user.created_at);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'completed';
      case 'selesai': return 'completed';
      case 'pending': return 'pending';
      case 'dikirim': return 'shipped';
      default: return 'pending';
    }
  };

  const getStatusText = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'SELESAI';
      case 'selesai': return 'SELESAI';
      case 'pending': return 'PENDING';
      case 'dikirim': return 'DIKIRIM';
      default: return status || 'PENDING';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard Pengguna</h1>
          <p>Selamat datang, <span>{user?.name || 'Pengguna'}</span></p>
        </div>
        <div className="header-right">
          <div className="user-badge">USER</div>
          <button className="btn-notification">🔔</button>
          <button onClick={handleLogout} className="btn-logout">
            <span>🚪</span> Logout
          </button>
        </div>
      </header>

      {/* Profile Summary Card */}
      <div className="profile-summary">
        <div className="profile-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="profile-info">
          <h2>{user?.name || 'Pengguna'}</h2>
          <p>{user?.email || 'email@example.com'}</p>
          <div className="profile-meta">
            <span>Member sejak {getMemberSince()}</span>
            <span>•</span>
            <span>{stats.totalOrders} Transaksi</span>
          </div>
        </div>
        <Link to="/pengguna/profile" className="edit-profile-btn">
          ✏️ Edit Profil
        </Link>
      </div>

      {/* Stats Cards - AKAN TAMPIL 0 UNTUK USER BARU */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Total Pesanan</h3>
            <p className="stat-value">{stats.totalOrders}</p>
            <span className="stat-label">TRANSAKSI</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Belanja</h3>
            <p className="stat-value">{formatRupiah(stats.totalSpent)}</p>
            <span className="stat-label">SEJAK BERGABUNG</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏺</div>
          <div className="stat-content">
            <h3>Kategori Favorit</h3>
            <p className="stat-value">{stats.favoriteCategory}</p>
            <span className="stat-label">PALING SERING DIBELI</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Aksi Cepat</h2>
        <div className="actions-grid">
          <Link to="/products" className="action-card">
            <div className="action-icon">🛒</div>
            <h3>Katalog Produk</h3>
            <p>Lihat koleksi produk terbaru</p>
          </Link>

          <Link to="/pengguna/profile" className="action-card">
            <div className="action-icon">👤</div>
            <h3>Profil Saya</h3>
            <p>Lihat dan edit profil</p>
          </Link>

          <Link to="/pengguna/orders" className="action-card">
            <div className="action-icon">📋</div>
            <h3>Pesanan Saya</h3>
            <p>Lihat riwayat pesanan</p>
          </Link>

          <Link to="/cart" className="action-card">
            <div className="action-icon">🛍️</div>
            <h3>Keranjang</h3>
            <p>Lihat keranjang belanja</p>
          </Link>
        </div>
      </div>

      {/* Recent Orders - AKAN TAMPIL "BELUM ADA PESANAN" UNTUK USER BARU */}
      <div className="recent-orders">
        <div className="section-header">
          <h2>Pesanan Terbaru</h2>
          {stats.totalOrders > 0 && (
            <Link to="/pengguna/orders" className="view-all">Lihat Semua →</Link>
          )}
        </div>

        {stats.totalOrders === 0 ? (
          <div className="no-orders">
            <p>Belum ada pesanan</p>
            <Link to="/products" className="btn-shop">
              Belanja Sekarang
            </Link>
          </div>
        ) : (
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>ID Pesanan</th>
                  <th>Tanggal</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td className="order-id">#{order.id}</td>
                    <td>{formatDate(order.created_at)}</td>
                    <td className="order-total">{formatRupiah(order.total_amount)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td>
                      <Link to={`/pengguna/orders/${order.id}`} className="btn-view">Detail</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recommended Products */}
      <div className="recommended-products">
        <div className="section-header">
          <h2>Rekomendasi Untuk Anda</h2>
          <Link to="/products" className="view-all">Lihat Semua →</Link>
        </div>

        <div className="products-grid">
          {recentProducts.length > 0 ? (
            recentProducts.map(product => (
              <Link to={`/products/${product.id}`} key={product.id} className="product-card">
                <img 
                  src={product.image_url || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe9ef?w=200'} 
                  alt={product.name}
                  onError={(e) => e.target.src = 'https://via.placeholder.com/200?text=Gerabah'}
                />
                <h4>{product.name}</h4>
                <p className="product-price">{formatRupiah(product.price)}</p>
              </Link>
            ))
          ) : (
            <p className="no-products">Tidak ada produk</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;