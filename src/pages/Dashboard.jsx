import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("semua");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token) {
      navigate("/");
    } else {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // ========== PRODUK TOKO GERABAH ==========
  const products = [
    // KATEGORI GUCI (1-5)
    {
      id: 1,
      name: "Guci Keramik Motif Mega Mendung",
      description: "Guci keramik tinggi 50cm dengan motif mega mendung khas Cirebon",
      price: 375000,
      stock: 8,
      category: "Guci",
      material: "Keramik",
      rating: 4.8,
      terjual: 45
    },
    
  ];
// Filter berdasarkan kategori
  const filteredProducts = products
    .filter(product => filter === "semua" ? true : product.category === filter)
    .filter(product => 
      search === "" ? true : 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase())
    );

  // Hitung statistik
  const categories = [...new Set(products.map(p => p.category))];
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalTerjual = products.reduce((sum, p) => sum + p.terjual, 0);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🏺 Toko Gerabah</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
      
      {user && (
        <div className="welcome-text">
          Selamat datang, <strong>{user.name}</strong> 
          <span className={`role-badge role-${user.role}`}>
            {user.role}
          </span>
        </div>
      )}
      
      {/* Statistik */}
      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Produk</h3>
          <p>{products.length}</p>
        </div>
        <div className="stat-card">
          <h3>Kategori</h3>
          <p>{categories.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Stok</h3>
          <p>{totalStock}</p>
        </div>
        <div className="stat-card">
          <h3>Terjual</h3>
          <p>{totalTerjual}</p>
        </div>
      </div>
      
      {/* Filter & Search */}
      <div className="filter-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="category-filter">
          <button 
            className={filter === "semua" ? "active" : ""}
            onClick={() => setFilter("semua")}
          >
            Semua
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={filter === cat ? "active" : ""}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      
      {/* Info hasil filter */}
      <p className="result-info">
        Menampilkan {filteredProducts.length} dari {products.length} produk
        {filter !== "semua" && ` (Kategori: ${filter})`}
      </p>
      
      {/* Grid Produk */}
      <div className="card-container">
        {filteredProducts.map(product => (
          <ProductCard 
            key={product.id}
            title={product.name}
            description={product.description}
            price={product.price.toLocaleString()}
            category={product.category}
            stock={product.stock}
            material={product.material}
            rating={product.rating}
            terjual={product.terjual}
          />
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="no-results">
          <p>😢 Produk tidak ditemukan</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;