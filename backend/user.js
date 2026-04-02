// backend/user.js
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config(); // <-- TAMBAHKAN INI!

// PAKAI DATABASE_URL DARI .ENV, BUKAN HARCODE!
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function buatUser() {
  try {
    // Test koneksi dulu
    const client = await pool.connect();
    console.log('✅ Koneksi Supabase berhasil!');
    client.release();

    const name = 'User Testing';
    const email = 'test@gerabah.com';
    const password = '123';
    const role = 'kasir';
    
    // Hash password dengan bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('📧 Email:', email);
    console.log('🔑 Password asli:', password);
    
    // Cek dulu apakah tabel users sudah ada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabel users siap');

    // Insert user baru
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      [name, email, hashedPassword, role]
    );
    
    console.log('✅ USER BERHASIL DIBUAT!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === '23505') {
      console.error('Email sudah terdaftar!');
    }
  } finally {
    await pool.end();
  }
}

// Jalankan fungsi hanya jika file dijalankan langsung (bukan di-import)
if (require.main === module) {
  buatUser();
}

module.exports = { buatUser }; // Ekspor jika diperlukan