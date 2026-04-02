// src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)'
    }}>
      {/* HERO SECTION */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏺 Toko Gerabah</h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem', maxWidth: '600px' }}>
          Temukan koleksi gerabah tradisional berkualitas tinggi, 
          dibuat oleh pengrajin berpengalaman
        </p>
        
        <div>
          <Link 
            to="/login" 
            style={{
              background: 'white',
              color: '#8B4513',
              textDecoration: 'none',
              padding: '15px 40px',
              borderRadius: '5px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              marginRight: '20px',
              display: 'inline-block'
            }}
          >
            Login
          </Link>
          
          <Link 
            to="/register" 
            style={{
              background: 'transparent',
              color: 'white',
              textDecoration: 'none',
              padding: '15px 40px',
              borderRadius: '5px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              border: '2px solid white',
              display: 'inline-block'
            }}
          >
            Register
          </Link>
        </div>
      </div>

      {/* FITUR SECTION */}
      <div style={{
        background: 'white',
        padding: '50px 20px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#8B4513', marginBottom: '40px' }}>Mengapa Memilih Kami?</h2>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          flexWrap: 'wrap',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {[
            { icon: '🏺', title: 'Produk Berkualitas', desc: 'Gerabah handmade dari pengrajin ahli' },
            { icon: '🎨', title: 'Motif Tradisional', desc: 'Desain khas Indonesia yang autentik' },
            { icon: '🚚', title: 'Pengiriman Aman', desc: 'Packing khusus untuk gerabah' }
          ].map((item, i) => (
            <div key={i} style={{
              flex: '1',
              minWidth: '250px',
              padding: '30px',
              background: '#f9f9f9',
              borderRadius: '10px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>{item.icon}</div>
              <h3 style={{ color: '#8B4513', marginBottom: '10px' }}>{item.title}</h3>
              <p style={{ color: '#666' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PRODUK UNGGULAN */}
      <div style={{
        padding: '50px 20px',
        background: '#f5f5f5',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#8B4513', marginBottom: '40px' }}>Produk Unggulan</h2>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          flexWrap: 'wrap',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {[
            { name: 'Vas Bunga', price: 'Rp 150.000', image: '🏺' },
            { name: 'Guci Hias', price: 'Rp 200.000', image: '🏺' },
            { name: 'Piring Hias', price: 'Rp 75.000', image: '🍽️' }
          ].map((item, i) => (
            <div key={i} style={{
              width: '250px',
              background: 'white',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                height: '200px',
                background: '#D2691E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem'
              }}>
                {item.image}
              </div>
              <div style={{ padding: '20px' }}>
                <h3 style={{ color: '#8B4513' }}>{item.name}</h3>
                <p style={{ color: '#D2691E', fontWeight: 'bold' }}>{item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{
        background: '#8B4513',
        color: 'white',
        textAlign: 'center',
        padding: '20px'
      }}>
        <p>© 2026 Toko Gerabah. Semua hak dilindungi.</p>
      </footer>
    </div>
  );
}

export default LandingPage;