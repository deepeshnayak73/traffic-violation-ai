import React, { useCallback, useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import api from '../services/api';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'officer', label: 'Officer' },
  { value: 'viewer', label: 'Viewer' },
];

const EMPTY_FORM = {
  username: '',
  email: '',
  password: '',
  role: 'viewer',
  is_active: true,
};

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/users/');
      setUsers(data.users);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (user) => {
    setForm({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      is_active: user.is_active,
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      username: form.username,
      email: form.email,
      role: form.role,
      is_active: form.is_active,
    };
    if (form.password) payload.password = form.password;

    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
      } else {
        if (!form.password) {
          setError('Password is required for new users');
          return;
        }
        await api.post('/users/', { ...payload, password: form.password });
      }
      cancelForm();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save user');
    }
  };

  const toggleActive = async (user) => {
    setError('');
    try {
      await api.put(`/users/${user.id}`, { is_active: !user.is_active });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user status');
    }
  };

  return (
    <AppLayout>
      <div style={styles.panel}>
        <div style={styles.header}>
          <h2 style={styles.title}>User Management</h2>
          <button type="button" style={styles.primaryBtn} onClick={openAddForm}>
            + Add user
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {showForm && (
          <form style={styles.form} onSubmit={handleSubmit}>
            <h3 style={styles.formTitle}>{editingId ? 'Edit user' : 'Create user'}</h3>
            <input
              style={styles.input}
              placeholder="Username *"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
            <input
              style={styles.input}
              type="email"
              placeholder="Email *"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              style={styles.input}
              type="password"
              placeholder={editingId ? 'New password (leave blank to keep)' : 'Password *'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editingId}
            />
            <select
              style={styles.input}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active account
            </label>
            <div style={styles.formActions}>
              <button type="submit" style={styles.primaryBtn}>
                {editingId ? 'Update' : 'Create'}
              </button>
              <button type="button" style={styles.secondaryBtn} onClick={cancelForm}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p style={styles.empty}>Loading users...</p>
        ) : users.length === 0 ? (
          <p style={styles.empty}>No users found.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>{u.username}</td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>{u.role}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: u.is_active ? '#00cc66' : '#888',
                    }}>
                      {u.is_active ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button type="button" style={styles.secondaryBtn} onClick={() => openEditForm(u)}>
                        Edit
                      </button>
                      <button type="button" style={styles.secondaryBtn} onClick={() => toggleActive(u)}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}

const styles = {
  panel: { backgroundColor: '#16213e', borderRadius: '12px', padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  title: { color: '#00d4ff', margin: 0 },
  error: { color: '#ff4444', marginBottom: '12px' },
  form: {
    backgroundColor: '#0f3460',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '480px',
  },
  formTitle: { color: '#00d4ff', margin: '0 0 8px 0' },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#16213e',
    color: '#fff',
    fontSize: '14px',
  },
  checkbox: { color: '#ccc', display: 'flex', alignItems: 'center', gap: '8px' },
  formActions: { display: 'flex', gap: '12px' },
  primaryBtn: {
    padding: '10px 20px',
    backgroundColor: '#00d4ff',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  secondaryBtn: {
    padding: '6px 12px',
    backgroundColor: '#0f3460',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    marginRight: '6px',
  },
  dangerBtn: {
    padding: '6px 12px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { backgroundColor: '#0f3460', color: '#00d4ff', padding: '12px', textAlign: 'left' },
  tr: { borderBottom: '1px solid #333' },
  td: { padding: '12px', color: '#ccc' },
  badge: { padding: '4px 10px', borderRadius: '20px', color: '#fff', fontSize: '12px' },
  actions: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
  empty: { color: '#888', textAlign: 'center', padding: '32px' },
};

export default UserManagement;
