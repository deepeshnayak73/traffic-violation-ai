import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import AppLayout from '../components/AppLayout';
import api from '../services/api';

const PIE_COLORS = ['#00d4ff', '#ff6b6b', '#ffd93d', '#6bcb77', '#9b59b6'];

function Analytics() {
  const [trendData, setTrendData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [trendRes, typeRes] = await Promise.all([
          api.get('/analytics/trend', { params: { days } }),
          api.get('/analytics/by-type'),
        ]);
        setTrendData(
          trendRes.data.trend.map((d) => ({
            date: d.date,
            count: d.count,
          }))
        );
        setTypeData(
          typeRes.data.by_type.map((d) => ({
            name: d.violation_type.replace(/_/g, ' '),
            value: d.count,
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [days]);

  return (
    <AppLayout>
      <div style={styles.header}>
        <h2 style={styles.title}>Analytics</h2>
        <label style={styles.daysLabel}>
          Trend period:
          <select
            style={styles.select}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p style={styles.loading}>Loading charts...</p>
      ) : (
        <div style={styles.charts}>
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Violation trend</h3>
            {trendData.length === 0 ? (
              <p style={styles.empty}>No trend data for this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" tick={{ fill: '#aaa', fontSize: 12 }} />
                  <YAxis stroke="#888" tick={{ fill: '#aaa', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#16213e', border: '1px solid #333' }}
                    labelStyle={{ color: '#00d4ff' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Violations"
                    stroke="#00d4ff"
                    strokeWidth={2}
                    dot={{ fill: '#00d4ff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Violations by type</h3>
            {typeData.length === 0 ? (
              <p style={styles.empty}>No violation type data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={typeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={{ stroke: '#888' }}
                  >
                    {typeData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#16213e', border: '1px solid #333' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

const styles = {
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '24px',
  },
  title: { color: '#00d4ff', margin: 0 },
  daysLabel: { color: '#aaa', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' },
  select: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#0f3460',
    color: '#fff',
  },
  loading: { color: '#888', textAlign: 'center' },
  charts: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  chartCard: {
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '24px',
  },
  chartTitle: { color: '#00d4ff', marginTop: 0, marginBottom: '16px' },
  empty: { color: '#888', textAlign: 'center', padding: '48px' },
};

export default Analytics;
