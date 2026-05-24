import React, { useCallback, useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const EMPTY_FORM = { name: '', location: '', source: '0' };

function CameraManagement() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchCameras = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/cameras/');
      setCameras(data.cameras);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load cameras');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (camera) => {
    setForm({
      name: camera.name || '',
      location: camera.location || '',
      source: camera.source || '0',
    });
    setEditingId(camera.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    setError('');
    try {
      if (editingId) {
        await api.put(`/cameras/${editingId}`, form);
      } else {
        await api.post('/cameras/', form);
      }
      cancelForm();
      fetchCameras();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save camera');
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('Delete this camera?')) return;

    setError('');
    try {
      await api.delete(`/cameras/${id}`);
      fetchCameras();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete camera');
    }
  };

  const statusColor = (status) => {
    if (status === 'running') return '#00cc66';
    if (status === 'stopped') return '#ff4444';
    return '#888';
  };

  return (
    <AppLayout>
      <div style={styles.panel}>
        <div style={styles.header}>
          <h2 style={styles.title}>Camera Management</h2>
          {isAdmin && (
            <button type="button" style={styles.primaryBtn} onClick={openAddForm}>
              + Add camera
            </button>
          )}
        </div>

        {!isAdmin && (
          <p style={styles.hint}>View only — add, edit, and delete are restricted to admins.</p>
        )}

        {error && <p style={styles.error}>{error}</p>}

        {showForm && isAdmin && (
          <form style={styles.form} onSubmit={handleSubmit}>
            <h3 style={styles.formTitle}>{editingId ? 'Edit camera' : 'Add camera'}</h3>
            <input
              style={styles.input}
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              style={styles.input}
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <input
              style={styles.input}
              placeholder="Source (0 = webcam, or RTSP URL)"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
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
          <p style={styles.empty}>Loading cameras...</p>
        ) : cameras.length === 0 ? (
          <p style={styles.empty}>No cameras configured.</p>
        ) : (
          <div style={styles.grid}>
            {cameras.map((cam) => (
              <div key={cam.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardName}>{cam.name}</h3>
                  <span style={{ ...styles.status, backgroundColor: statusColor(cam.status) }}>
                    {cam.status}
                  </span>
                </div>
                <p style={styles.cardMeta}>📍 {cam.location || 'No location'}</p>
                <p style={styles.cardMeta}>Source: {cam.source}</p>
                {isAdmin && (
                  <div style={styles.cardActions}>
                    <button
                      type="button"
                      style={styles.secondaryBtn}
                      onClick={() => openEditForm(cam)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      style={styles.dangerBtn}
                      onClick={() => handleDelete(cam.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

const styles = {
  panel: {
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: { color: '#00d4ff', margin: 0 },
  hint: { color: '#888', fontSize: '14px', marginBottom: '16px' },
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
  formTitle: { color: '#00d4ff', margin: '0 0 8px 0', fontSize: '16px' },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#16213e',
    color: '#fff',
    fontSize: '14px',
  },
  formActions: { display: 'flex', gap: '12px', marginTop: '8px' },
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
    padding: '8px 16px',
    backgroundColor: '#0f3460',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  dangerBtn: {
    padding: '8px 16px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: '#0f3460',
    borderRadius: '8px',
    padding: '16px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  },
  cardName: { color: '#fff', margin: 0, fontSize: '16px' },
  status: {
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#fff',
    fontSize: '11px',
    textTransform: 'uppercase',
  },
  cardMeta: { color: '#aaa', fontSize: '13px', margin: '8px 0 0' },
  cardActions: { display: 'flex', gap: '8px', marginTop: '16px' },
  empty: { color: '#888', textAlign: 'center', padding: '32px' },
};

export default CameraManagement;
