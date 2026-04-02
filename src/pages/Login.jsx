// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // <-- TAMBAHKAN Link
import './Login.css';

function Login() {
  const [email, setEmail] = useState("");        
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: email,          
          password: password 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        alert(`Login berhasil! Selamat datang ${data.user.name}`);
        
        // Redirect berdasarkan role
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else if (data.user.role === 'kasir') {
          navigate('/cashier');
        } else {
          navigate('/pengguna');
        }
      } else {
        alert(data.message || "Login gagal");
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <span className="logo-icon">🏺</span>
          </div>
          <h1>Toko Gerabah</h1>
          <p>Masuk ke Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Email</label>
            <div className="input-field">
              <span className="input-icon">📧</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gerabah.com"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-field">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox">
              <input type="checkbox" /> Ingat saya
            </label>
            {/* ============ PERBAIKAN 1: Ganti <a> dengan Link ============ */}
            <Link to="/forgot-password" className="forgot-link">
              Lupa password?
            </Link>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Memproses...
              </>
            ) : (
              'Masuk ke Aplikasi'
            )}
          </button>
        </form>

        {/* ============ PERBAIKAN 2: Ganti <a> dengan Link ============ */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #DEB887'
        }}>
          <span style={{ color: '#666' }}>Belum punya akun? </span>
          <Link 
            to="/register"
            style={{
              color: '#D2691E',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Daftar di sini
          </Link>
        </div>

        <div className="demo-accounts">
          <p className="demo-title">Akun Demo:</p>
          <div className="demo-buttons">
            <button 
              className="demo-btn admin"
              onClick={() => {
                setEmail('admin@gerabah.com');
                setPassword('admin123');
              }}
            >
              Admin
            </button>
            <button 
              className="demo-btn kasir"
              onClick={() => {
                setEmail('kasir@gerabah.com');
                setPassword('kasir123');
              }}
            >
              Kasir
            </button>
            <button 
              className="demo-btn user"
              onClick={() => {
                setEmail('user@gerabah.com');
                setPassword('user123');
              }}
            >
              User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;