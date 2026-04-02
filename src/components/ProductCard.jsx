// src/components/ProductCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductCard.css';

function ProductCard({ 
  id, 
  title, 
  description, 
  price, 
  category, 
  stock, 
  material, 
  rating, 
  terjual,
  image_url,
  onEdit,
  onDelete,
  onBuy,
  userRole 
}) {
  
  const navigate = useNavigate();

  const formatRupiah = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const goToDetail = () => {
    navigate(`/products/${id}`);
  };

  return (
    <div className="product-card">
      {/* Gambar */}
      <div className="product-image-container" onClick={goToDetail}>
        <img 
          src={image_url || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe9ef?w=400'} 
          alt={title}
          className="product-image"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=Gerabah';
          }}
        />
        {stock <= 5 && stock > 0 && (
          <span className="stock-badge warning">Stok Terbatas</span>
        )}
        {stock === 0 && (
          <span className="stock-badge danger">Habis</span>
        )}
      </div>
      
      {/* Konten */}
      <div className="product-content" onClick={goToDetail}>
        <h3>🏺 {title}</h3>
        
        <div className="product-badges">
          {category && (
            <span className="category-badge">{category}</span>
          )}
          {material && (
            <span className="material-badge">{material}</span>
          )}
        </div>
        
        <p className="product-description">{description}</p>
        
        <div className="product-stats">
          {rating && (
            <span className="rating">⭐ {rating}</span>
          )}
          {terjual && (
            <span className="sold">Terjual {terjual}</span>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="product-footer">
        <span className="price">{formatRupiah(price)}</span>
        
        {stock !== undefined && (
          <span className={`stock-${stock > 10 ? 'high' : stock > 0 ? 'medium' : 'low'}`}>
            Stok: {stock}
          </span>
        )}
      </div>
      
      {/* Actions */}
      <div className="product-actions">
        <button 
          className="buy-btn" 
          onClick={(e) => {
            e.stopPropagation();
            onBuy && onBuy({ id, title, price });
          }}
        >
          🛒 Beli
        </button>
        
        <button 
          className="detail-btn"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/products/${id}`);
          }}
        >
          🔍 Detail
        </button>
        
        {/* ============ PERBAIKAN: HANYA ADMIN ============ */}
        {userRole === 'admin' && (
          <>
            <button 
              className="edit-btn" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit({ id, title, description, price, stock, category, material, image_url });
              }}
              title="Edit Produk"
            >
              ✏️
            </button>
            <button 
              className="delete-btn" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete && onDelete(id, title);
              }}
              title="Hapus Produk"
            >
              🗑️
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ProductCard;