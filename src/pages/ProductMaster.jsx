// src/pages/ProductMaster.jsx
import React, { useState, useEffect, useCallback } from 'react'; // <-- TAMBAHKAN useCallback
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import './ProductMaster.css';

// Komponen Loading Spinner
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Memuat data produk...</p>
  </div>
);

// Komponen Toast Notification
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};

// Komponen Konfirmasi Hapus
const DeleteConfirmModal = ({ show, product, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="modal delete-modal">
      <div className="modal-content delete-content">
        <div className="delete-icon">🗑️</div>
        <h3>Hapus Produk</h3>
        <p>Apakah Anda yakin ingin menghapus produk <strong>"{product?.name}"</strong>?</p>
        <p className="delete-warning">Tindakan ini tidak dapat dibatalkan!</p>
        <div className="modal-actions">
          <button onClick={onConfirm} className="btn-delete-confirm">Ya, Hapus</button>
          <button onClick={onCancel} className="btn-cancel">Batal</button>
        </div>
      </div>
    </div>
  );
};

function ProductMaster() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [categories, setCategories] = useState(['Semua']);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image_url: ''
  });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // ============ PERBAIKAN 1: Gunakan useCallback untuk fetchProducts ============
  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (!response.ok) throw new Error('Gagal mengambil data');
      const data = await response.json();
      console.log('Data dari API:', data);
      setProducts(data);
      
      // Ekstrak kategori unik
      const uniqueCategories = ['Semua', ...new Set(data.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []); // Tidak ada dependency karena tidak menggunakan state/props dari komponen

  // ============ PERBAIKAN 2: Tambahkan fetchProducts ke dependency array ============
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProducts();
  }, [navigate, fetchProducts]); // <-- TAMBAHKAN fetchProducts

  // Show toast message
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Reset filter ke default
  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('Semua');
  };

  // Filter produk
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'Semua' || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Hitung statistik
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalSold = products.reduce((sum, p) => sum + (p.sold || 0), 0);
  const categoriesCount = categories.length - 1;

  // Handle form input
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Fungsi upload gambar
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;


    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file maksimal 5MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setFormData(prev => ({
        ...prev,
        image_url: data.image_url
      }));
      showToast('✅ Gambar berhasil diupload!', 'success');
    } catch (error) {
      showToast('❌ ' + error.message, 'error');
    } finally {
      setUploading(false);

      e.target.value = '';
    }
  };

  // CREATE - Buka modal tambah
  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      image_url: ''
    });
    setShowModal(true);
  };

  // UPDATE - Buka modal edit
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: product.category || '',
      image_url: product.image_url || ''
    });
    setShowModal(true);
  };

  // Fungsi untuk beli produk
  const handleBuy = (product) => {
    alert(`🛒 Membeli ${product.title} seharga ${formatRupiah(product.price)}`);
  };

  // CREATE / UPDATE - Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingProduct 
        ? `http://localhost:5000/api/products/${editingProduct.id}`
        : 'http://localhost:5000/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Gagal menyimpan');
      
      setShowModal(false);
      await fetchProducts();
      showToast(editingProduct ? 'Produk berhasil diupdate!' : 'Produk berhasil ditambahkan!');
    } catch (err) {
      console.error('Error:', err);
      showToast(err.message, 'error');
    }
  };

  // Konfirmasi hapus
  const confirmDelete = (id, name) => {
    setProductToDelete({ id, name });
    setShowDeleteConfirm(true);
  };

  // DELETE - Hapus produk
  const handleDelete = async () => {
    if (!productToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Gagal menghapus');
      
      await fetchProducts();
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      showToast('Produk berhasil dihapus!');
    } catch (err) {
      console.error('Error:', err);
      showToast(err.message, 'error');
    }
  };

  // Format rupiah
  const formatRupiah = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="product-master">
      {/* Toast Notification */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal 
        show={showDeleteConfirm}
        product={productToDelete}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setProductToDelete(null);
        }}
      />

      {/* Header */}
      <div className="master-header">
        <div className="header-left">
          <h1>🏺 Master Produk</h1>
          <span className="header-subtitle">Toko Gerabah</span>
        </div>
        <div className="user-info">
          <div className="user-greeting">
            <span className="greeting-text">Selamat datang,</span>
            <span className="user-name">{user.name}</span>
            <span className={`role-badge role-${user.role}`}>{user.role}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      {/* Statistik Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-details">
            <span className="stat-label">Total Produk</span>
            <span className="stat-value">{totalProducts}</span>
            <span className="stat-sub">{categoriesCount} Kategori</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-details">
            <span className="stat-label">Total Stok</span>
            <span className="stat-value">{totalStock}</span>
            <span className="stat-sub">Unit tersedia</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-details">
            <span className="stat-label">Terjual</span>
            <span className="stat-value">{totalSold}</span>
            <span className="stat-sub">Produk laku</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-group">
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button onClick={resetFilters} className="btn-reset" title="Reset filter">
            <span>⟲</span> Reset
          </button>

          {user.role === 'admin' && (
            <button onClick={handleAdd} className="btn-add">
              <span>+</span> Tambah Produk
            </button>
          )}
        </div>
      </div>

      {/* Info Bar */}
      <div className="info-bar">
        <span>Menampilkan <strong>{filteredProducts.length}</strong> dari <strong>{products.length}</strong> produk</span>
        {filteredProducts.length < products.length && (
          <button onClick={resetFilters} className="info-reset">
            Reset Filter
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}
      
      {/* Products Grid */}
      <div className="products-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.name}
              description={product.description}
              price={product.price}
              category={product.category}
              stock={product.stock}
              rating={4.8}
              terjual={product.sold || 45}
              image_url={product.image_url}
              userRole={user.role}
              onEdit={handleEdit}
              onDelete={confirmDelete}
              onBuy={handleBuy}
            />
          ))
        ) : (
          <div className="no-products">
            <div className="no-products-icon">🏺</div>
            <h3>Tidak Ada Produk</h3>
            <p>Tidak ada produk yang sesuai dengan filter yang dipilih.</p>
            <button onClick={resetFilters} className="btn-reset-large">
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
            <form onSubmit={handleSubmit}>
              {/* Form fields - tetap sama */}
              <div className="form-group">
                <label>Nama Produk <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Masukkan nama produk"
                />
              </div>
              
              <div className="form-group">
                <label>Deskripsi</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Masukkan deskripsi produk"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Harga <span className="required">*</span></label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Stok</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Kategori</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Contoh: Guci, Vas, Piring"
                />
              </div>
              
              {/* Upload Gambar */}
              <div className="form-group">
                <label>Gambar Produk</label>
                
                <div className="upload-section">
                  <p className="upload-option-title">📁 Upload dari komputer</p>
                  <div className="upload-container">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="file-input"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="upload-label">
                      {uploading ? '⏳ Mengupload...' : '📁 Pilih Gambar'}
                    </label>
                    {uploading && <span className="upload-spinner"></span>}
                  </div>
                  <small className="form-text">Maksimal 5MB (jpg, png, gif, webp)</small>
                </div>


                {formData.image_url && (
                  <div className="image-preview">
                    <img src={formData.image_url} alt="Preview" />
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, image_url: ''})}
                      className="remove-image"
                      title="Hapus gambar"
                    >
                      ×
                    </button>
                  </div>
                )}


                <div className="url-section">
                  <p className="upload-option-title">🔗 Atau masukkan URL gambar</p>
                  <div className="url-input-wrapper">
                    <input
                      type="url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      placeholder="https://example.com/gambar.jpg"
                      className="url-input"
                    />

                  </div>
                  <small className="form-text">
                    Contoh: https://images.unsplash.com/photo-1565193566173-7a0ee3dbe9ef
                  </small>
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="btn-save" disabled={uploading}>
                  {uploading ? '⏳ Mengupload...' : (editingProduct ? 'Update Produk' : 'Simpan Produk')}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductMaster;