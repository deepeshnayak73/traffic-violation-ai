import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/violations', label: 'Violations' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/cameras', label: 'Cameras' },
  { path: '/users', label: 'Users', roles: ['admin'] },
];

function AppLayout({ children }) {
  const { username, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <header style={styles.navbar}>
        <Link to="/dashboard" style={styles.brandLink}>
          <h2 style={styles.navTitle}>🚦 Traffic Violation AI</h2>
        </Link>
        <nav style={styles.navLinks} aria-label="Main navigation">
          {NAV_ITEMS.filter(
            (item) => !item.roles || hasRole(...item.roles)
          ).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navLink,
                ...(location.pathname === item.path ||
                (item.path === '/violations' && location.pathname.startsWith('/violations/'))
                  ? styles.navLinkActive
                  : {}),
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={styles.navRight}>
          <span style={styles.welcome}>👤 {username}</span>
          <button type="button" style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#1a1a2e', color: '#fff' },
  navbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#16213e',
    padding: '16px 32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  brandLink: { textDecoration: 'none' },
  navTitle: { color: '#00d4ff', margin: 0, fontSize: '20px' },
  navLinks: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    flex: 1,
    justifyContent: 'center',
  },
  navLink: {
    color: '#aaa',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'background-color 0.15s, color 0.15s',
  },
  navLinkActive: {
    color: '#00d4ff',
    backgroundColor: '#0f3460',
    fontWeight: 600,
  },
  navRight: { display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' },
  welcome: { color: '#aaa', fontSize: '14px' },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  main: { padding: '24px 32px' },
};

export default AppLayout;
