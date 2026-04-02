const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("./db");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

// ============ KONFIGURASI UPLOAD GAMBAR ============
// Buat folder uploads jika belum ada
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Folder uploads dibuat');
}

// Konfigurasi storage untuk multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

// Filter file yang diizinkan (hanya gambar)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diizinkan (jpeg, jpg, png, gif, webp)'));
  }
};

// Inisialisasi multer
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB
  fileFilter: fileFilter
});

// Serve static files dari folder uploads
app.use('/uploads', express.static(uploadDir));

// ============ MIDDLEWARE (HARUS DI ATAS ENDPOINT) ============
// Verifikasi token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Token tidak ditemukan" });
  }

  try {
    const decoded = jwt.verify(token, "RAHASIA_BANGET");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token tidak valid" });
  }
};

// Verifikasi role admin
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Akses khusus admin" });
  }
  next();
};

// Verifikasi role kasir atau admin
const verifyKasirOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'kasir') {
    return res.status(403).json({ message: "Akses khusus kasir dan admin" });
  }
  next();
};

// ============ AUTH ROUTES ============
// LOGIN
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Email tidak ditemukan" });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: "Password salah" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      "RAHASIA_BANGET",
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login berhasil",
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// REGISTER
app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password minimal 6 karakter" });
  }

  try {
    const emailCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword, "user"]
    );

    res.status(201).json({
      message: "Registrasi berhasil",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ============ CRUD USERS (ADMIN ONLY) ============
app.get("/api/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/users/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/users", verifyToken, verifyAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  try {
    const emailCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword, role || "user"]
    );

    res.status(201).json({
      message: "User berhasil ditambahkan",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/users/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  try {
    const userCheck = await pool.query(
      "SELECT id FROM users WHERE id = $1",
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = $1, email = $2, role = $3 
       WHERE id = $4 
       RETURNING id, name, email, role, created_at`,
      [name, email, role, id]
    );

    res.json({
      message: "User berhasil diupdate",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/users/:id/password", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password = $1 WHERE id = $2",
      [hashedPassword, id]
    );

    res.json({ message: "Password berhasil diubah" });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/users/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: "Tidak bisa menghapus akun sendiri" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json({ message: "User berhasil dihapus" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ============ API PRODUK ============
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/products", verifyToken, verifyAdmin, async (req, res) => {
  const { name, description, price, stock, category, image_url } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock, category, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, description, price, stock || 0, category, image_url]
    );

    res.status(201).json({
      message: "Produk berhasil ditambahkan",
      product: result.rows[0]
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/products/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, category, image_url } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products 
       SET name = $1, description = $2, price = $3, stock = $4, 
           category = $5, image_url = $6, updated_at = NOW()
       WHERE id = $7 
       RETURNING *`,
      [name, description, price, stock, category, image_url, id]
    );

    res.json({
      message: "Produk berhasil diupdate",
      product: result.rows[0]
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/products/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [id]
    );

    res.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/products/top-selling", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id, p.name, p.price, p.image_url,
        COALESCE(SUM(ti.quantity), 0) as total_sold
      FROM products p
      LEFT JOIN transaction_items ti ON p.id = ti.product_id
      GROUP BY p.id, p.name, p.price, p.image_url
      ORDER BY total_sold DESC
      LIMIT 10
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Get top selling products error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ============ API TRANSAKSI ============
app.get("/api/transactions", verifyToken, verifyKasirOrAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.name as user_name 
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/user/transactions", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, 
        (SELECT json_agg(json_build_object(
          'id', ti.id,
          'product_name', p.name,
          'quantity', ti.quantity,
          'price', ti.price,
          'subtotal', ti.subtotal
        )) FROM transaction_items ti
        JOIN products p ON ti.product_id = p.id
        WHERE ti.transaction_id = t.id) as items
       FROM transactions t
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get user transactions error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/transactions/:id", verifyToken, verifyKasirOrAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    const transactionResult = await pool.query(
      `SELECT t.*, u.name as user_name, u.email as user_email
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [id]
    );
    
    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }
    
    const itemsResult = await pool.query(
      `SELECT ti.*, p.name as product_name, p.image_url
       FROM transaction_items ti
       JOIN products p ON ti.product_id = p.id
       WHERE ti.transaction_id = $1`,
      [id]
    );
    
    res.json({
      ...transactionResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error("Get transaction error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/checkout", verifyToken, verifyKasirOrAdmin, async (req, res) => {
  const { items, payment_method, customer_name, customer_email } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Keranjang belanja kosong" });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    let total = 0;
    for (const item of items) {
      total += item.price * item.quantity;
    }
    
    const transactionResult = await client.query(
      `INSERT INTO transactions (user_id, customer_name, customer_email, total_amount, payment_method, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [req.user.id, customer_name || null, customer_email || null, total, payment_method || 'cash', 'completed']
    );
    
    const transaction = transactionResult.rows[0];
    
    for (const item of items) {
      await client.query(
        `INSERT INTO transaction_items (transaction_id, product_id, quantity, price, subtotal) 
         VALUES ($1, $2, $3, $4, $5)`,
        [transaction.id, item.id, item.quantity, item.price, item.price * item.quantity]
      );
      
      await client.query(
        `UPDATE products SET stock = stock - $1 WHERE id = $2`,
        [item.quantity, item.id]
      );
    }
    
    await client.query('COMMIT');
    
    const fullTransaction = await pool.query(
      `SELECT t.*, u.name as user_name 
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [transaction.id]
    );
    
    res.status(201).json({
      message: "Transaksi berhasil",
      transaction: fullTransaction.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Checkout error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

app.get("/api/sales/today", verifyToken, verifyKasirOrAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(
          (SELECT COALESCE(SUM(quantity), 0) FROM transaction_items WHERE transaction_id = transactions.id)
        ), 0) as total_items_sold
       FROM transactions 
       WHERE DATE(created_at) = $1`,
      [today]
    );
    
    res.json({
      date: today,
      total_transactions: parseInt(result.rows[0].total_transactions),
      total_sales: parseFloat(result.rows[0].total_sales),
      total_items_sold: parseInt(result.rows[0].total_items_sold)
    });
  } catch (error) {
    console.error("Get today's sales error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/sales/monthly", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_sales
      FROM transactions
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Get monthly sales error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ============ ENDPOINT UPLOAD GAMBAR (DIPINDAH KE BAWAH MIDDLEWARE) ============
app.post('/api/upload', verifyToken, verifyAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diupload' });
    }

    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    
    res.status(201).json({
      message: 'Gambar berhasil diupload',
      image_url: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Gagal upload gambar: ' + error.message });
  }
});

// ============ TEST ROUTE ============
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is running with transaction features and image upload!" });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server Toko Gerabah jalan di http://localhost:${PORT}`);
  console.log(`✅ Fitur transaksi telah diaktifkan`);
  console.log(`✅ Fitur upload gambar telah diaktifkan`);
  console.log(`📁 Folder uploads: ${uploadDir}`);
});