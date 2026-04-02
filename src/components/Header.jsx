function Header() {
  return (
    <header style={{
      background: '#2c3e50',
      color: 'white',
      padding: '1rem 2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ margin: 0 }}>Aplikasi Product Dashboard</h1>
      </div>
    </header>
  );
}

export default Header;