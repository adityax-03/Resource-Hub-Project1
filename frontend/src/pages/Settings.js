import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ThreeBackground from "../components/ThreeBackground";
import Cursor from "../components/Cursor";
import Toast from "../components/Toast";
import api from "../services/api";

function Settings() {
  const { user, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [name, setName] = useState(user?.name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "", show: false });

  const handleLogout = () => { logout(); navigate("/login"); };
  const getInitials = (n) => !n ? "??" : n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      return setToast({ message: "Passwords do not match", type: "error", show: true });
    }
    if (password && password.length < 6) {
      return setToast({ message: "Password must be at least 6 characters", type: "error", show: true });
    }

    setLoading(true);
    try {
      const res = await api.post("/api/auth/update-profile", { name, password });
      login(res.data.token, res.data.user); // Update auth context
      setToast({ message: "Profile updated successfully!", type: "success", show: true });
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setToast({ message: error.response?.data?.message || "Failed to update profile", type: "error", show: true });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (window.confirm("Are you sure you want to completely deactivate your account? This action cannot be undone.")) {
      try {
        await api.delete("/api/auth/delete-account");
        logout();
        navigate("/login");
      } catch (error) {
        setToast({ message: error.response?.data?.message || "Failed to deactivate account", type: "error", show: true });
      }
    }
  };

  return (
    <>
      <Cursor />
      <ThreeBackground />
      <div className="grain" />

      <Toast
        message={toast.message} type={toast.type} show={toast.show}
        onDismiss={() => setToast({ ...toast, show: false })}
      />

      <div className="dash-body">
        {/* SIDEBAR */}
        <aside className="sidebar" id="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">R</div>
            <span className="logo-text">Resource Hub</span>
          </div>
          <nav className="sidebar-nav">
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <div className="nav-item"><span className="nav-icon">📊</span><span>Dashboard</span></div>
            </Link>
            <Link to="/resources" style={{ textDecoration: 'none' }}>
              <div className="nav-item"><span className="nav-icon">📁</span><span>Resources</span></div>
            </Link>
            <Link to="/team" style={{ textDecoration: 'none' }}>
              <div className="nav-item"><span className="nav-icon">👥</span><span>Team</span></div>
            </Link>
            <Link to="/upload" style={{ textDecoration: 'none' }}>
              <div className="nav-item"><span className="nav-icon">⬆</span><span>Upload</span></div>
            </Link>
            <div className="nav-divider" />
            <div className="nav-item active"><span className="nav-icon">⚙</span><span>Settings</span></div>
          </nav>
          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">{getInitials(user?.name)}</div>
              <div className="user-info">
                <span className="user-name">{user?.name || "User"}</span>
                <span className="user-role">{user?.role || "member"}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="dash-main">
          <header className="topbar">
            <div className="topbar-left">
              <button className="sidebar-toggle" id="sidebarToggle" onClick={() => document.getElementById("sidebar")?.classList.toggle("collapsed")}>☰</button>
            </div>
            <div className="topbar-right">
              <span className={`role-badge ${isAdmin ? 'admin' : 'member'}`}>
                <span className="role-dot" />{isAdmin ? 'Admin' : 'Member'}
              </span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
              <div className="topbar-avatar">{getInitials(user?.name)}</div>
            </div>
          </header>

          <div className="page-content page-enter">
            <div className="welcome-banner">
              <div>
                <h2 className="welcome-name">⚙ Settings</h2>
                <p className="welcome-sub">Manage your account and profile preferences.</p>
              </div>
            </div>

            <div className="panel" style={{ maxWidth: 600 }}>
              <h3 style={{ marginBottom: '24px' }}>Profile Information</h3>
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(240,236,228,.5)' }}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                      padding: '12px 16px', borderRadius: '12px', color: '#f0ece4', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(240,236,228,.5)' }}>Email Address (Unchangeable)</label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    style={{
                      width: '100%', background: 'transparent', border: '1px dashed rgba(255,255,255,.1)',
                      padding: '12px 16px', borderRadius: '12px', color: 'rgba(240,236,228,.4)', outline: 'none', cursor: 'not-allowed'
                    }}
                  />
                </div>

                <div style={{ margin: '16px 0', height: 1, background: 'rgba(255,255,255,.06)' }} />

                <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Change Password</h4>
                <p style={{ fontSize: '13px', color: 'rgba(240,236,228,.4)', marginBottom: '8px' }}>Leave blank if you don't want to change it.</p>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(240,236,228,.5)' }}>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                      padding: '12px 16px', borderRadius: '12px', color: '#f0ece4', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'rgba(240,236,228,.5)' }}>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                      padding: '12px 16px', borderRadius: '12px', color: '#f0ece4', outline: 'none'
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading || (!name && !password)}
                  className="btn btn-primary" 
                  style={{ marginTop: '16px', padding: '14px' }}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>

            {/* DANGER ZONE */}
            <div className="panel" style={{ maxWidth: 600, marginTop: 24, border: '1px solid rgba(255, 31, 90, 0.3)', background: 'linear-gradient(135deg, rgba(255,31,90,0.05) 0%, transparent 100%)' }}>
              <h3 style={{ marginBottom: 12, color: '#ff1f5a' }}>Danger Zone</h3>
              <p style={{ fontSize: 13, color: 'rgba(240,236,228,.6)', marginBottom: 20 }}>
                Permanently deactivate your account. Any resources you uploaded will remain active to not disrupt your team's access, but you will instantly lose all access to the system.
              </p>
              <button 
                onClick={handleDeactivateAccount}
                style={{
                  background: 'transparent', border: '1px solid #ff1f5a', color: '#ff1f5a',
                  padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
                  fontSize: 13, transition: 'all 0.2s', alignSelf: 'flex-start'
                }}
                onMouseOver={(e) => { e.target.style.background = '#ff1f5a'; e.target.style.color = '#fff'; }}
                onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#ff1f5a'; }}
              >
                Deactivate My Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Settings;
