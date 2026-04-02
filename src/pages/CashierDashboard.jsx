// src/pages/CashierDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CashierDashboard.css';

function CashierDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    todayTransactions: 0,
    todaySales: 0,
    totalProducts: 0,
    lowStock: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const navigate = useNavigate();

  // Fungsi untuk handle navigasi dengan cek token
  const handleNavigation = (path) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    navigate(path);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('🔍 Token di CashierDashboard:', token ? 'Ada' : 'Tidak ada');
    
    if (!token) {
      console.log('❌ Token tidak ada, redirect ke login');
      navigate('/login');
      return;
    }
    
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.role !== 'kasir' && parsedUser.role !== 'admin') {
        navigate('/dashboard');
      }
    }
    
    // Validasi token dengan panggil API
    const validateToken = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401 || response.status === 403) {
          console.log('❌ Token tidak valid, redirect ke login');
          localStorage.clear();
          navigate('/login');
          return;
        }
        
        // Token valid, fetch data
        fetchDashboardData();
      } catch (error) {
        console.error('Error validating token:', error);
      }
    };
    
    validateToken();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch today's sales
      const salesRes = await fetch('http://localhost:5000/api/sales/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const salesData = await salesRes.json();
      
      // Fetch products for low stock
      const productsRes = await fetch('http://localhost:5000/api/products');
      const productsData = await productsRes.json();
      
      // Fetch recent transactions
      const transactionsRes = await fetch('http://localhost:5000/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const transactionsData = await transactionsRes.json();
      
      // Hitung stok menipis
      const lowStock = productsData.filter(p => p.stock <= 5);
      
      setStats({
        todayTransactions: salesData.total_transactions || 0,
        todaySales: salesData.total_sales || 0,
        totalProducts: productsData.length,
        lowStock: lowStock.length
      });
      
      setLowStockProducts(lowStock.slice(0, 5));
      setRecentTransactions(transactionsData.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="cashier-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard Kasir</h1>
          <p>Selamat datang, <span>{user?.name}</span></p>
        </div>
        <div className="header-right">
          <div className="role-badge kasir">KASIR</div>
          <button 
            onClick={() => handleNavigation('/cashier/transaction')} 
            className="btn-primary"
          >
            🛒 Mulai Transaksi
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card transactions">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Transaksi Hari Ini</h3>
            <p className="stat-value">{stats.todayTransactions}</p>
            <span className="stat-label">TRANSAKSI</span>
          </div>
        </div>

        <div className="stat-card sales">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Penjualan</h3>
            <p className="stat-value">{formatRupiah(stats.todaySales)}</p>
            <span className="stat-label">HARI INI</span>
          </div>
        </div>

        <div className="stat-card products">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Total Produk</h3>
            <p className="stat-value">{stats.totalProducts}</p>
            <span className="stat-label">DI KATALOG</span>
          </div>
        </div>

        <div className="stat-card lowstock">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Stok Menipis</h3>
            <p className="stat-value">{stats.lowStock}</p>
            <span className="stat-label">PERLU RESTOCK</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Aksi Cepat</h2>
        <div className="actions-grid">
          <button 
            onClick={() => handleNavigation('/cashier/transaction')} 
            className="action-card transaction"
          >
            <div className="action-icon">🛒</div>
            <h3>Transaksi Baru</h3>
            <p>Mulai transaksi penjualan</p>
          </button>

          <button 
            onClick={() => handleNavigation('/products')} 
            className="action-card view"
          >
            <div className="action-icon">📋</div>
            <h3>Lihat Produk</h3>
            <p>Cek stok dan harga produk</p>
          </button>

          {/* TOMBOL RIWAYAT TRANSAKSI - SUDAH DIPERBAIKI */}
          <button 
            onClick={() => handleNavigation('/cashier/history')} 
            className="action-card history"
          >
            <div className="action-icon">📜</div>
            <h3>Riwayat Transaksi</h3>
            <p>Lihat transaksi sebelumnya</p>
          </button>

          <button 
            onClick={() => handleNavigation('/cashier/transaction?mode=quick')} 
            className="action-card quick"
          >
            <div className="action-icon">⚡</div>
            <h3>Quick Sale</h3>
            <p>Transaksi cepat tanpa cari produk</p>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="recent-transactions">
        <div className="section-header">
          <h2>Transaksi Terbaru</h2>
          {/* TOMBOL LIHAT SEMUA - SUDAH DIPERBAIKI */}
          <button 
            onClick={() => handleNavigation('/cashier/history')} 
            className="view-all"
          >
            Lihat Semua →
          </button>
        </div>

        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Waktu</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td>#{tx.id}</td>
                    <td>{formatDate(tx.created_at)}</td>
                    <td>{tx.customer_name || 'Umum'}</td>
                    <td className="amount">{formatRupiah(tx.total_amount)}</td>
                    <td>
                      <span className={`status-badge ${tx.status}`}>
                        {tx.status === 'completed' ? 'Selesai' : tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">
                    Belum ada transaksi hari ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stok Menipis */}
      {lowStockProducts.length > 0 && (
        <div className="low-stock-section">
          <div className="section-header">
            <h2>⚠️ Stok Menipis</h2>
            <button 
              onClick={() => handleNavigation('/products')} 
              className="view-all"
            >
              Lihat Semua →
            </button>
          </div>

          <div className="low-stock-grid">
            {lowStockProducts.map(product => (
              <div key={product.id} className="low-stock-card">
                <img 
                  src={product.image_url || 'https://via.placeholder.com/60'} 
                  alt={product.name}
                  className="product-image-small"
                />
                <div className="product-details">
                  <h4>{product.name}</h4>
                  <p className="product-price-small">{formatRupiah(product.price)}</p>
                </div>
                <div className="stock-warning">
                  <span className="stock-number">{product.stock}</span>
                  <span className="stock-label">tersisa</span>
                </div>
                <button 
                  onClick={() => handleNavigation('/cashier/transaction')} 
                  className="btn-restock"
                >
                  Jual
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CashierDashboard;