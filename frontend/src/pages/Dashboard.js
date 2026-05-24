import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import api from '../services/api';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    fetchSummary();
    fetchViolations();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/violations/summary');
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchViolations = async () => {
    try {
      const res = await api.get('/violations/', { params: { limit: 10 } });
      setViolations(res.data.violations);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <div style={styles.cardRow}>
        <div style={styles.card}>
          <h3 style={styles.cardNum}>{summary?.total_violations ?? '...'}</h3>
          <p style={styles.cardLabel}>Total Violations</p>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardNum}>{summary?.today_violations ?? '...'}</h3>
          <p style={styles.cardLabel}>Today's Violations</p>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardNum}>{summary?.pending_review ?? '...'}</h3>
          <p style={styles.cardLabel}>Pending Review</p>
        </div>
      </div>

      {/* Live stream + violations */}
      <div style={styles.mainContent}>
        <div style={styles.streamContainer}>
          <h3 style={styles.sectionTitle}>Live Camera Feed</h3>
          <img
            src="http://127.0.0.1:5000/api/stream"
            alt="Live traffic camera"
            style={styles.streamImage}
          />
        </div>

        <div style={styles.tableContainer}>
          <h3 style={styles.sectionTitle}>Violations</h3>
          {violations.length === 0 ? (
            <p style={styles.noData}>No violations found.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Location</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((v) => (
                  <tr key={v._id} style={styles.tr}>
                    <td style={styles.td}>{v.violation_type}</td>
                    <td style={styles.td}>{v.location || 'N/A'}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: v.status === 'pending' ? '#ff4444' : '#00cc66'
                      }}>
                        {v.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {v.detected_at ? new Date(v.detected_at).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

const styles = {
  cardRow: { display: 'flex', gap: '24px', padding: '8px 0 32px', justifyContent: 'center' },
  card: { backgroundColor: '#16213e', padding: '24px 40px', borderRadius: '12px',
    textAlign: 'center', flex: 1, maxWidth: '200px' },
  cardNum: { color: '#00d4ff', fontSize: '36px', margin: '0 0 8px 0' },
  cardLabel: { color: '#888', margin: 0 },
  mainContent: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  streamContainer: {
    flex: '1 1 480px',
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '24px',
  },
  streamImage: {
    width: '100%',
    maxWidth: '640px',
    borderRadius: '8px',
    border: '2px solid #0f3460',
    display: 'block',
    backgroundColor: '#000',
  },
  sectionTitle: { color: '#00d4ff', marginTop: 0, marginBottom: '16px' },
  tableContainer: {
    flex: '1 1 400px',
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '24px',
    overflowX: 'auto',
  },
  noData: { color: '#888', textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { backgroundColor: '#0f3460', color: '#00d4ff', padding: '12px', textAlign: 'left' },
  tr: { borderBottom: '1px solid #333' },
  td: { padding: '12px', color: '#ccc' },
  badge: { padding: '4px 10px', borderRadius: '20px', color: '#fff', fontSize: '12px' },
};

export default Dashboard;