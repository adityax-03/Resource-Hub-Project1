import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', backgroundColor: '#060612', color: '#f0ece4'
      }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', height: '100vh', backgroundColor: '#060612',
        color: '#f0ece4', fontFamily: "'Bricolage Grotesque', sans-serif",
        textAlign: 'center', padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '24px', backdropFilter: 'blur(24px)',
          padding: '48px 56px', maxWidth: '460px'
        }}>
          <div style={{
            fontSize: '48px', marginBottom: '16px'
          }}>🔒</div>
          <h2 style={{
            fontSize: '28px', fontWeight: 700, marginBottom: '12px',
            background: 'linear-gradient(120deg, #fff, #c8b8ff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Access Denied
          </h2>
          <p style={{
            fontSize: '15px', color: 'rgba(240,236,228,0.4)',
            lineHeight: 1.6, marginBottom: '28px'
          }}>
            This section is restricted to administrators only.
            Contact your team admin to request elevated permissions.
          </p>
          <a href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '13px 32px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #ff4d1c, #ff1f5a)',
            color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 500,
            boxShadow: '0 8px 32px rgba(255,77,28,0.32)',
            transition: 'transform 0.22s, box-shadow 0.22s'
          }}>
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
