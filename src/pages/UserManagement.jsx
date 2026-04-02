// src/pages/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const navigate = useNavigate();

  // Cek token saat load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      alert('Akses khusus admin');
      navigate('/dashboard');
      return;
    }
    
    fetchUsers();
  }, [navigate]);

  // Ambil semua users
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Gagal mengambil data');
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle input form
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Open modal untuk tambah user
  const handleAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'user' });
    setShowModal(true);
  };

  // Open modal untuk edit user
  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '' // password dikosongkan untuk edit
    });
    setShowModal(true);
  };

  // Submit form (tambah/edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingUser 
        ? `http://localhost:5000/api/users/${editingUser.id}`
        : 'http://localhost:5000/api/users';
      
      const method = editingUser ? 'PUT' : 'POST';
      
      // Untuk edit, jangan kirim password jika kosong
      const body = editingUser
        ? { name: formData.name, email: formData.email, role: formData.role }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Gagal menyimpan data');
      
      setShowModal(false);
      fetchUsers(); // refresh data
    } catch (err) {
      alert(err.message);
    }
  };

  // Hapus user
  const handleDelete = async (id, email) => {
    if (!window.confirm(`Yakin ingin menghapus user ${email}?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Gagal menghapus user');
      
      fetchUsers(); // refresh data
    } catch (err) {
      alert(err.message);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="user-management">
      <div className="header">
        <h1>Manajemen Users</h1>
        <div className="header-buttons">
          <button onClick={handleAdd} className="btn-add">+ Tambah User</button>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <table className="user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama</th>
            <th>Email</th>
            <th>Role</th>
            <th>Dibuat</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <span className={`role-badge role-${user.role}`}>
                  {user.role}
                </span>
              </td>
              <td>{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
              <td className="actions">
                <button onClick={() => handleEdit(user)} className="btn-edit">Edit</button>
                <button onClick={() => handleDelete(user.id, user.email)} className="btn-delete">Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Form */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingUser ? 'Edit User' : 'Tambah User Baru'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nama:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {!editingUser && (
                <div className="form-group">
                  <label>Password:</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                    minLength="6"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Role:</label>
                <select name="role" value={formData.role} onChange={handleInputChange}>
                  <option value="user">User</option>
                  <option value="kasir">Kasir</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-save">Simpan</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;