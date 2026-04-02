// src/pages/ProductDetail.jsx
import React, { useState, useEffect, useCallback } from 'react'; // <-- TAMBAHKAN useCallback
import { useParams, useNavigate } from 'react-router-dom'; // <-- HAPUS Link
import './ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ============ PERBAIKAN 1: Gunakan useCallback ============
  const fetchProductDetail = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`);
      if (!response.ok) throw new Error('Produk tidak ditemukan');
      const data = await response.json();
      setProduct(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]); // <-- fetchProductDetail tergantung pada id

  // ============ PERBAIKAN 2: Tambahkan dependency ============
  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]); // <-- GUNAKAN fetchProductDetail SEBAGAI DEPENDENCY

  const formatRupiah = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) return <div className="detail-loading">Memuat detail produk...</div>;
  if (error) return <div className="detail-error">{error}</div>;
  if (!product) return <div className="detail-error">Produk tidak ditemukan</div>;

  return (
    <div className="product-detail-container">
      <button onClick={() => navigate(-1)} className="back-button">
        ← Kembali
      </button>

      <div className="product-detail-card">
        <div className="detail-image-section">
          <img 
            src={product.image_url || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe9ef?w=600'} 
            alt={product.name}
            className="detail-image"
          />
          <span className={`detail-stock-badge ${product.stock <= 5 ? 'low' : 'good'}`}>
            {product.stock <= 5 ? 'Stok Terbatas' : 'Stok Tersedia'}
          </span>
        </div>

        <div className="detail-info-section">
          <div className="detail-header">
            <h1>{product.name}</h1>
            <span className="detail-category">{product.category || 'Umum'}</span>
          </div>

          <div className="detail-rating">
            <span className="stars">⭐⭐⭐⭐⭐</span>
            <span className="rating-value">4.8</span>
            <span className="rating-count">(124 ulasan)</span>
          </div>

          <p className="detail-description">{product.description}</p>

          <div className="detail-price-section">
            <span className="price-label">Harga</span>
            <span className="detail-price">{formatRupiah(product.price)}</span>
          </div>

          <div className="detail-stock-section">
            <span className="stock-label">Stok tersedia</span>
            <span className={`detail-stock ${product.stock <= 5 ? 'low' : ''}`}>
              {product.stock} unit
            </span>
          </div>

          <div className="detail-meta">
            <div className="meta-item">
              <span className="meta-label">Terjual</span>
              <span className="meta-value">{product.sold || 45}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Kategori</span>
              <span className="meta-value">{product.category || 'Umum'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">ID Produk</span>
              <span className="meta-value">#{product.id}</span>
            </div>
          </div>

          <div className="detail-actions">
            <button className="btn-buy-large">
              <span>🛒</span> Beli Sekarang
            </button>
            <button className="btn-cart">
              <span>➕</span> Tambah ke Keranjang
            </button>
          </div>

          <div className="detail-share">
            <span>Bagikan:</span>
            <button className="share-btn">📘</button>
            <button className="share-btn">📱</button>
            <button className="share-btn">🔗</button>
          </div>
        </div>
      </div>

      {/* Produk Terkait */}
      <div className="related-products">
        <h2>Produk Terkait</h2>
        <div className="related-grid">
          {/* Ini bisa diisi dengan produk dari kategori yang sama */}
          <div className="related-card">
            <img src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe9ef?w=200" alt="produk" />
            <h4>Produk Terkait 1</h4>
            <p>{formatRupiah(150000)}</p>
          </div>
          <div className="related-card">
            <img src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe9ef?w=200" alt="produk" />
            <h4>Produk Terkait 2</h4>
            <p>{formatRupiah(200000)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;