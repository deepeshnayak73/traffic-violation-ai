import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import api, { API_BASE_URL } from '../services/api';

function ViolationDetail() {
  const { id } = useParams();
  const [violation, setViolation] = useState(null);
  const [frameUrl, setFrameUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [frameError, setFrameError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/violations/${id}`);
        setViolation(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load violation');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    let objectUrl = null;

    const loadFrame = async () => {
      setFrameError('');
      try {
        const { data } = await api.get(`/violations/${id}/frame`, {
          responseType: 'blob',
        });
        objectUrl = URL.createObjectURL(data);
        setFrameUrl(objectUrl);
      } catch (err) {
        setFrameUrl(null);
        setFrameError(err.response?.data?.error || 'Frame snapshot not available');
      }
    };

    if (violation) loadFrame();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, violation]);

  const statusColor = (status) => {
    if (status === 'pending') return '#ff4444';
    if (status === 'reviewed') return '#00cc66';
    return '#00d4ff';
  };

  if (loading) {
    return (
      <AppLayout>
        <p style={styles.loading}>Loading violation...</p>
      </AppLayout>
    );
  }

  if (error || !violation) {
    return (
      <AppLayout>
        <p style={styles.error}>{error || 'Violation not found'}</p>
        <Link to="/violations" style={styles.backLink}>← Back to violations</Link>
      </AppLayout>
    );
  }

  const metaRows = [
    ['Type', violation.violation_type],
    ['Status', violation.status],
    ['Location', violation.location || 'N/A'],
    ['Severity', violation.severity || 'N/A'],
    ['Fine', violation.fine != null ? `₹${violation.fine}` : 'N/A'],
    ['Confidence', violation.confidence != null ? `${(violation.confidence * 100).toFixed(1)}%` : 'N/A'],
    ['Description', violation.description || 'N/A'],
    ['Detected at', violation.detected_at ? new Date(violation.detected_at).toLocaleString() : 'N/A'],
    ['Reviewed by', violation.reviewed_by || '—'],
    ['Updated at', violation.updated_at ? new Date(violation.updated_at).toLocaleString() : 'N/A'],
    ['Frame path', violation.frame_path || '—'],
  ];

  return (
    <AppLayout>
      <Link to="/violations" style={styles.backLink}>← Back to violations</Link>

      <div style={styles.header}>
        <h2 style={styles.title}>Violation Detail</h2>
        <span style={{ ...styles.badge, backgroundColor: statusColor(violation.status) }}>
          {violation.status}
        </span>
      </div>

      <div style={styles.content}>
        <div style={styles.frameCard}>
          <h3 style={styles.sectionTitle}>Frame snapshot</h3>
          {frameUrl ? (
            <img src={frameUrl} alt="Violation frame" style={styles.frameImage} />
          ) : (
            <div style={styles.noFrame}>
              <p>{frameError || 'No snapshot available'}</p>
              {violation.frame_path && (
                <p style={styles.hint}>Expected: {violation.frame_path}</p>
              )}
            </div>
          )}
        </div>

        <div style={styles.metaCard}>
          <h3 style={styles.sectionTitle}>Metadata</h3>
          <dl style={styles.metaList}>
            {metaRows.map(([label, value]) => (
              <div key={label} style={styles.metaRow}>
                <dt style={styles.metaLabel}>{label}</dt>
                <dd style={styles.metaValue}>{value}</dd>
              </div>
            ))}
          </dl>
          {violation.bbox && (
            <p style={styles.hint}>Bounding box: [{violation.bbox.join(', ')}]</p>
          )}
          <p style={styles.hint}>API: {API_BASE_URL}/violations/{id}</p>
        </div>
      </div>
    </AppLayout>
  );
}

const styles = {
  loading: { color: '#888' },
  error: { color: '#ff4444' },
  backLink: { color: '#00d4ff', textDecoration: 'none', display: 'inline-block', marginBottom: '16px' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  title: { color: '#00d4ff', margin: 0 },
  badge: { padding: '6px 14px', borderRadius: '20px', color: '#fff', fontSize: '13px' },
  content: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
  },
  frameCard: {
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '24px',
  },
  metaCard: {
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '24px',
  },
  sectionTitle: { color: '#00d4ff', marginTop: 0, marginBottom: '16px' },
  frameImage: {
    width: '100%',
    maxHeight: '480px',
    objectFit: 'contain',
    borderRadius: '8px',
    border: '2px solid #0f3460',
    backgroundColor: '#000',
  },
  noFrame: {
    padding: '48px',
    textAlign: 'center',
    color: '#888',
    backgroundColor: '#0f3460',
    borderRadius: '8px',
  },
  metaList: { margin: 0 },
  metaRow: {
    display: 'grid',
    gridTemplateColumns: '140px 1fr',
    gap: '8px',
    padding: '10px 0',
    borderBottom: '1px solid #333',
  },
  metaLabel: { color: '#888', margin: 0, fontWeight: 500 },
  metaValue: { color: '#fff', margin: 0 },
  hint: { color: '#666', fontSize: '12px', marginTop: '12px' },
};

export default ViolationDetail;
