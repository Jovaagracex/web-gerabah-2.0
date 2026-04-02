// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    revenue: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('🔍 Token di AdminDashboard:', token ? 'Ada' : 'Tidak ada');
    
    if (!token) {
      console.log('❌ Token tidak ada, redirect ke login');
      navigate('/login');
      return;
    }
    
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      if (parsedUser.role !== 'admin') {
        console.log('❌ Bukan admin, redirect ke dashboard');
        navigate('/dashboard');
        return;
      }
    }
    
    // Validasi token dengan panggil API
    const validateToken = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401 || response.status === 403) {
          console.log('❌ Token tidak valid, redirect ke login');
          localStorage.clear();
          navigate('/login');
          return;
        }
        
        // Token valid, lanjut fetch data
        await Promise.all([fetchStats(), fetchRecentProducts()]);
      } catch (error) {
        console.error('Error validating token:', error);
      } finally {
        setLoading(false);
      }
    };
    
    validateToken();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Ambil data produk
      const productsRes = await fetch('http://localhost:5000/api/products');
      const products = await productsRes.json();
      
      // Ambil data users
      const usersRes = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const users = await usersRes.json();
      
      setStats({
        totalProducts: products.length,
        totalUsers: users.length,
        totalOrders: 45,
        revenue: 15000000
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      setRecentProducts(data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus produk "${name}"?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Gagal menghapus');
      
      // Refresh data
      await Promise.all([fetchStats(), fetchRecentProducts()]);
      alert('✅ Produk berhasil dihapus!');
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const formatRupiah = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard Admin</h1>
          <p>Selamat datang kembali, <span>{user?.name}</span></p>
        </div>
        <div className="header-right">
          <div className="admin-badge">ADMIN</div>
          <button className="btn-notification">🔔</button>
          <Link to="/product-master" className="btn-primary">
            + Kelola Produk
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card products">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Total Produk</h3>
            <p className="stat-value">{stats.totalProducts}</p>
            <Link to="/product-master" className="stat-link">Lihat Semua →</Link>
          </div>
        </div>

        <div className="stat-card users">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total User</h3>
            <p className="stat-value">{stats.totalUsers}</p>
            <Link to="/admin/users" className="stat-link">Kelola User →</Link>
          </div>
        </div>

        <div className="stat-card orders">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Total Pesanan</h3>
            <p className="stat-value">{stats.totalOrders}</p>
            <span className="stat-link">Lihat Detail →</span>
          </div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Pendapatan</h3>
            <p className="stat-value">{formatRupiah(stats.revenue)}</p>
            <span className="stat-link">Bulan Ini</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Aksi Cepat</h2>
        <div className="actions-grid">
          <Link to="/product-master" className="action-card">
            <div className="action-icon">➕</div>
            <h3>Tambah Produk</h3>
            <p>Buat produk baru</p>
          </Link>

          <Link to="/product-master" className="action-card">
            <div className="action-icon">✏️</div>
            <h3>Edit Produk</h3>
            <p>Update produk existing</p>
          </Link>

          <Link to="/product-master" className="action-card">
            <div className="action-icon">🗑️</div>
            <h3>Hapus Produk</h3>
            <p>Hapus produk dari katalog</p>
          </Link>

          <Link to="/admin/users" className="action-card">
            <div className="action-icon">👤</div>
            <h3>Tambah User</h3>
            <p>Buat akun baru</p>
          </Link>
        </div>
      </div>

      {/* Recent Products */}
      <div className="recent-products">
        <div className="section-header">
          <h2>Produk Terbaru</h2>
          <Link to="/product-master" className="view-all">Lihat Semua →</Link>
        </div>

        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.map(product => (
                <tr key={product.id}>
                  <td>
                    <div className="product-info">
                      <img 
                        src={product.image_url || 'https://via.placeholder.com/40'} 
                        alt={product.name}
                        className="product-thumb"
                      />
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td>{product.category || '-'}</td>
                  <td>{formatRupiah(product.price)}</td>
                  <td>
                    <span className={`stock-badge ${product.stock <= 5 ? 'low' : 'good'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <Link to={`/product-master?edit=${product.id}`} className="btn-edit" title="Edit Produk">✏️</Link>
                    <button 
                      onClick={() => handleDeleteProduct(product.id, product.name)} 
                      className="btn-delete"
                      title="Hapus Produk"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;