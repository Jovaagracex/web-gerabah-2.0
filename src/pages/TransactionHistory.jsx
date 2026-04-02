// src/pages/TransactionHistory.jsx
import React, { useState, useEffect, useCallback } from 'react'; // <-- TAMBAHKAN useCallback
import { useNavigate } from 'react-router-dom';
import './TransactionHistory.css';

function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const navigate = useNavigate();

  // ============ PERBAIKAN 1: Gunakan useCallback untuk fetchTransactions ============
  const fetchTransactions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('📡 Fetching transactions with token');
      
      const response = await fetch('http://localhost:5000/api/transactions', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📥 Response status:', response.status);
      
      if (response.status === 401 || response.status === 403) {
        console.log('❌ Token tidak valid, redirect ke login');
        localStorage.clear();
        navigate('/login');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Transactions fetched:', data.length);
      setTransactions(data);
      setFilteredTransactions(data);
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]); // <-- fetchTransactions tergantung pada navigate

  // ============ PERBAIKAN 2: Tambahkan dependency yang benar ============
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('🔍 TransactionHistory - Token:', token ? 'Ada' : 'Tidak ada');
    
    if (!token) {
      console.log('❌ Token tidak ada, redirect ke login');
      navigate('/login');
      return;
    }
    
    fetchTransactions();
  }, [navigate, fetchTransactions]); // <-- TAMBAHKAN fetchTransactions

  // Filter transactions based on search and status
  useEffect(() => {
    let filtered = transactions;
    
    // Filter by search term (customer name or transaction ID)
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        (tx.customer_name && tx.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tx.id.toString().includes(searchTerm)
      );
    }
    
    // Filter by status
    if (statusFilter !== 'Semua') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }
    
    setFilteredTransactions(filtered);
  }, [searchTerm, statusFilter, transactions]);

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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'completed': return 'Selesai';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  const handleViewDetail = (id) => {
    console.log('View detail for transaction:', id);
  };

  if (loading) return <div className="loading">Memuat transaksi...</div>;

  return (
    <div className="transaction-history">
      <div className="history-header">
        <h1>Riwayat Transaksi</h1>
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Kembali
        </button>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <input
          type="text"
          placeholder="Cari customer atau ID transaksi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="filter-input"
        />
        
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="Semua">Semua Status</option>
          <option value="completed">Selesai</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="no-transactions">
          <p>{transactions.length === 0 ? 'Belum ada transaksi' : 'Tidak ada transaksi yang sesuai filter'}</p>
          {transactions.length === 0 && (
            <button onClick={() => navigate('/cashier/transaction')} className="btn-primary">
              Mulai Transaksi
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="transaction-stats">
            <p>Menampilkan <strong>{filteredTransactions.length}</strong> dari <strong>{transactions.length}</strong> transaksi</p>
          </div>
          
          <div className="transactions-list">
            {filteredTransactions.map(tx => (
              <div key={tx.id} className="transaction-card">
                <div className="transaction-header">
                  <span className="transaction-id">#{tx.id}</span>
                  <span className={`status-badge ${tx.status}`}>
                    {getStatusText(tx.status)}
                  </span>
                </div>
                <div className="transaction-body">
                  <div className="transaction-info">
                    <p><strong>Waktu:</strong> {formatDate(tx.created_at)}</p>
                    <p><strong>Customer:</strong> {tx.customer_name || 'Umum'}</p>
                    <p><strong>Kasir:</strong> {tx.user_name}</p>
                  </div>
                  <div className="transaction-total">
                    <span className="total-label">Total:</span>
                    <span className="total-amount">{formatRupiah(tx.total_amount)}</span>
                  </div>
                </div>
                <button 
                  className="btn-detail"
                  onClick={() => handleViewDetail(tx.id)}
                >
                  Lihat Detail
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default TransactionHistory;