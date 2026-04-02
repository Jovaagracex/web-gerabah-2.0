// backend/db.js
const { Pool } = require('pg');

// Dapatkan IP dari hasil nslookup
const POOLER_IPS = ['13.213.241.248', '3.1.167.181', '52.77.146.31'];

async function connectWithIP(ip) {
  const pool = new Pool({
    host: ip,
    port: 5432,
    database: 'postgres',
    user: 'postgres.bgehbrjpatmxkjdgbmir',
    password: 'GerabahToko2025',
    ssl: {
      rejectUnauthorized: false,
      sslmode: 'require'
    },
    connectionTimeoutMillis: 5000
  });

  try {
    const client = await pool.connect();
    console.log(`✅ Connected using IP: ${ip}`);
    client.release();
    return pool;
  } catch (err) {
    console.log(`❌ Failed with IP ${ip}: ${err.message}`);
    await pool.end();
    return null;
  }
}

// Coba semua IP sampai berhasil
async function findWorkingConnection() {
  console.log('🔄 Mencoba koneksi ke Supabase...');
  
  for (const ip of POOLER_IPS) {
    const pool = await connectWithIP(ip);
    if (pool) return pool;
  }
  
  console.error('❌ Semua IP gagal. Coba nonaktifkan firewall:');
  console.error('1. Buka Windows Security');
  console.error('2. Firewall & network protection');
  console.error('3. Matikan firewall sementara');
  console.error('\nAtau coba command:');
  console.error('netsh advfirewall set allprofiles state off');
  
  // Fallback ke connection string asli
  return new Pool({
    connectionString: 'postgresql://postgres.bgehbrjpatmxkjdgbmir:GerabahToko2025@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
}

// Inisialisasi pool
let pool;
findWorkingConnection().then(p => {
  pool = p;
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect()
};