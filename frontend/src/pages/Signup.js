import React, { useState } from 'react';
import axios from 'axios';

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.username || !formData.email || !formData.password) {
      setError('Saare fields fill karo!');
      setLoading(false);
      return;
    }

    try {
      await axios.post('http://127.0.0.1:5000/api/auth/register', formData);
      setSuccess('Account ban gaya! Ab login karo 🎉');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Kuch galat hua, dobara try karo!');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🚦 Traffic Violation AI</h1>
        <p style={styles.subtitle}>Create Account</p>

        {error && <p style={styles.error}>❌ {error}</p>}
        {success && <p style={styles.success}>✅ {success}</p>}

        <input
          style={styles.input}
          type="text"
          name="username"
          placeholder="Full Name"
          value={formData.username}
          onChange={handleChange}
        />
        <input
          style={styles.input}
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          style={styles.input}
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
        <select
          style={styles.input}
          name="role"
          value={formData.role}
          onChange={handleChange}
        >
          <option value="viewer">Viewer</option>
          <option value="officer">Officer</option>
          <option value="admin">Admin</option>
        </select>

        <button
          style={styles.button}
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <p style={styles.loginText}>
          Already have an account?{' '}
          <span
            style={styles.loginLink}
            onClick={() => window.location.href = '/login'}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
  },
  card: {
    backgroundColor: '#16213e',
    padding: '40px',
    borderRadius: '12px',
    width: '380px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  title: {
    color: '#00d4ff',
    textAlign: 'center',
    marginBottom: '8px',
    fontSize: '24px',
  },
  subtitle: {
    color: '#888',
    textAlign: 'center',
    marginBottom: '24px',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '16px',
    borderRadius: '8px',
    border: '1px solid #333',
    backgroundColor: '#0f3460',
    color: '#fff',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#00d4ff',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  error: {
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: '16px',
    fontSize: '14px',
  },
  success: {
    color: '#00cc66',
    textAlign: 'center',
    marginBottom: '16px',
    fontSize: '14px',
  },
  loginText: {
    color: '#888',
    textAlign: 'center',
    fontSize: '14px',
  },
  loginLink: {
    color: '#00d4ff',
    cursor: 'pointer',
    textDecoration: 'underline',
  }
};

export default Signup;