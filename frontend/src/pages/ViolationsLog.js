import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import api from '../services/api';

const VIOLATION_TYPES = [
  { value: '', label: 'All types' },
  { value: 'no_helmet', label: 'No helmet' },
  { value: 'no_seatbelt', label: 'No seatbelt' },
];

const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'challan_issued', label: 'Challan issued' },
];

const PAGE_SIZE = 10;

function ViolationsLog() {
  const [violations, setViolations] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    from: '',
    to: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const fetchViolations = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (appliedFilters.type) params.type = appliedFilters.type;
      if (appliedFilters.status) params.status = appliedFilters.status;
      if (appliedFilters.from) params.from = appliedFilters.from;
      if (appliedFilters.to) params.to = appliedFilters.to;

      const { data } = await api.get('/violations/', { params });
      setViolations(data.violations);
      setTotal(data.total);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, appliedFilters]);

  useEffect(() => {
    fetchViolations();
  }, [fetchViolations]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    setAppliedFilters(filters);
    setPage(1);
  };

  const clearFilters = () => {
    const empty = { type: '', status: '', from: '', to: '' };
    setFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
  };

  const statusColor = (status) => {
    if (status === 'pending') return '#ff4444';
    if (status === 'reviewed') return '#00cc66';
    return '#00d4ff';
  };

  return (
    <AppLayout>
      <div style={styles.panel}>
        <h2 style={styles.title}>Violations Log</h2>

        <form style={styles.filters} onSubmit={applyFilters}>
          <select
            style={styles.input}
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            {VIOLATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            style={styles.input}
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <input
            type="date"
            style={styles.input}
            value={filters.from}
            onChange={(e) => handleFilterChange('from', e.target.value)}
            title="From date"
          />
          <input
            type="date"
            style={styles.input}
            value={filters.to}
            onChange={(e) => handleFilterChange('to', e.target.value)}
            title="To date"
          />
          <button type="submit" style={styles.primaryBtn}>Apply</button>
          <button type="button" style={styles.secondaryBtn} onClick={clearFilters}>
            Clear
          </button>
        </form>

        <p style={styles.meta}>{total} violation(s) found</p>

        {loading ? (
          <p style={styles.noData}>Loading...</p>
        ) : violations.length === 0 ? (
          <p style={styles.noData}>No violations found.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Location</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Detected at</th>
                  <th style={styles.th}>Confidence</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((v) => (
                  <tr key={v._id} style={styles.tr}>
                    <td style={styles.td}>{v.violation_type}</td>
                    <td style={styles.td}>{v.location || 'N/A'}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, backgroundColor: statusColor(v.status) }}>
                        {v.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {v.detected_at ? new Date(v.detected_at).toLocaleString() : 'N/A'}
                    </td>
                    <td style={styles.td}>
                      {v.confidence != null ? `${(v.confidence * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td style={styles.td}>
                      <Link to={`/violations/${v._id}`} style={styles.viewLink}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={styles.pagination}>
          <button
            type="button"
            style={styles.secondaryBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span style={styles.pageInfo}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            style={styles.secondaryBtn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
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
  title: { color: '#00d4ff', marginTop: 0 },
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '16px',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#0f3460',
    color: '#fff',
    fontSize: '14px',
  },
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
    padding: '10px 20px',
    backgroundColor: '#0f3460',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  meta: { color: '#888', fontSize: '14px' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { backgroundColor: '#0f3460', color: '#00d4ff', padding: '12px', textAlign: 'left' },
  tr: { borderBottom: '1px solid #333' },
  td: { padding: '12px', color: '#ccc' },
  badge: { padding: '4px 10px', borderRadius: '20px', color: '#fff', fontSize: '12px' },
  noData: { color: '#888', textAlign: 'center', padding: '24px' },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '24px',
  },
  pageInfo: { color: '#aaa' },
  viewLink: { color: '#00d4ff', textDecoration: 'none' },
};

export default ViolationsLog;
