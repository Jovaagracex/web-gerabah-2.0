import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail"; 
import AdminDashboard from "./pages/AdminDashboard";
import CashierDashboard from "./pages/CashierDashboard";
import CashierTransaction from "./pages/CashierTransaction";
import TransactionHistory from "./pages/TransactionHistory"; // <-- TAMBAHKAN IMPORT
import UserDashboard from "./pages/UserDashboard";
import ProductMaster from "./pages/ProductMaster";

// Protected Route component dengan LOGGING
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  console.log('🔍 Protected Route - Path:', window.location.pathname); // <-- TAMBAHKAN PATH
  console.log('🔍 Protected Route - Token:', token ? 'Ada' : 'Tidak ada');
  console.log('🔍 Protected Route - User:', user);
  console.log('🔍 Protected Route - Role:', user.role);
  console.log('🔍 Protected Route - Allowed Roles:', allowedRoles);

  if (!token) {
    console.log('❌ Redirect ke login - Token tidak ada');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log(`❌ Redirect - Role ${user.role} tidak diizinkan. Required:`, allowedRoles);
    return <Navigate to="/dashboard" replace />;
  }

  console.log('✅ Akses diizinkan');
  return children;
};

function App() {
  return (
    <div>
      <Header />
      <div style={{ minHeight: '80vh' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Product Routes */}
          <Route path="/products" element={
            <ProtectedRoute allowedRoles={['admin', 'kasir', 'user']}>
              <Products />
            </ProtectedRoute>
          } />
          
          <Route path="/products/:id" element={
            <ProtectedRoute allowedRoles={['admin', 'kasir', 'user']}>
              <ProductDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/product-master" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ProductMaster />
            </ProtectedRoute>
          } />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'kasir', 'user']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          
          {/* CASHIER ROUTES */}
          <Route path="/cashier" element={
            <ProtectedRoute allowedRoles={['kasir', 'admin']}>
              <CashierDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/cashier/transaction" element={
            <ProtectedRoute allowedRoles={['kasir', 'admin']}>
              <CashierTransaction />
            </ProtectedRoute>
          } />
          
          {/* ============ ROUTE UNTUK RIWAYAT TRANSAKSI ============ */}
          <Route path="/cashier/history" element={
            <ProtectedRoute allowedRoles={['kasir', 'admin']}>
              <TransactionHistory />
            </ProtectedRoute>
          } />
          
          <Route path="/pengguna" element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;