import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './utils/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ViolationsLog from './pages/ViolationsLog';
import Analytics from './pages/Analytics';
import CameraManagement from './pages/CameraManagement';
import UserManagement from './pages/UserManagement';
import ViolationDetail from './pages/ViolationDetail';

function Unauthorized() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e', color: '#ff4444' }}>
      <h2>Access denied — insufficient permissions</h2>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['admin', 'officer', 'viewer']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/violations"
            element={
              <ProtectedRoute roles={['admin', 'officer', 'viewer']}>
                <ViolationsLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute roles={['admin', 'officer', 'viewer']}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cameras"
            element={
              <ProtectedRoute roles={['admin', 'officer', 'viewer']}>
                <CameraManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/violations/:id"
            element={
              <ProtectedRoute roles={['admin', 'officer', 'viewer']}>
                <ViolationDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;