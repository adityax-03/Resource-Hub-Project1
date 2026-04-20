import { useEffect, useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ThreeBackground from "../components/ThreeBackground";
import Cursor from "../components/Cursor";
import Toast from "../components/Toast";
import NotificationBell from "../components/NotificationBell";
import api from "../services/api";
import "../styles/dashboard.css";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function UploadResource() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [resourceName, setResourceName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [visibility, setVisibility] = useState("public");
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "", show: false });
  const [dragOver, setDragOver] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };
  const getInitials = (name) => !name ? "??" : name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!resourceName.trim() || !file) {
      setToast({ message: "Please fill in all fields and select a file", type: "error", show: true });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setToast({ message: "File too large. Maximum size is 10MB.", type: "error", show: true });
      return;
    }
    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("resourceName", resourceName);
      formData.append("description", description);
      formData.append("file", file);
      formData.append("userId", user._id);
      formData.append("visibility", visibility);
      if (user.teamId) formData.append("teamId", user.teamId);

      await api.post("/api/resource/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setToast({ message: "Resource uploaded successfully!", type: "success", show: true });
      setResourceName(""); setDescription(""); setFile(null);
      const fileInput = document.getElementById("file-input");
      if (fileInput) fileInput.value = "";
      setTimeout(() => navigate('/resources'), 1500);
    } catch (error) {
      setToast({ message: error.response?.data?.message || "Upload failed", type: "error", show: true });
    } finally {
      setUploading(false);
    }
  };

  // Sidebar toggle
  useEffect(() => {
    const sidebar = document.getElementById("sidebar");
    const toggle = document.getElementById("sidebarToggle");
    const handler = () => sidebar?.classList.toggle("collapsed");
    toggle?.addEventListener("click", handler);
    return () => toggle?.removeEventListener("click", handler);
  }, []);

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
            <div className="nav-item active">
              <span className="nav-icon">⬆</span><span>Upload</span>
            </div>
            <div className="nav-divider" />
            <Link to="/settings" style={{ textDecoration: 'none' }}>
              <div className="nav-item"><span className="nav-icon">⚙</span><span>Settings</span></div>
            </Link>
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
              <button className="sidebar-toggle" id="sidebarToggle">☰</button>
            </div>
            <div className="topbar-right">
              <span className={`role-badge ${isAdmin ? 'admin' : 'member'}`}>
                <span className="role-dot" />{isAdmin ? 'Admin' : 'Member'}
              </span>
              <NotificationBell />
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
              <div className="topbar-avatar">{getInitials(user?.name)}</div>
            </div>
          </header>

          <div className="page-content page-enter">

            <div className="welcome-banner">
              <div>
                <h2 className="welcome-name">⬆ Upload Resource</h2>
                <p className="welcome-sub">Share a file with your team.</p>
              </div>
              <Link to="/resources" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary" style={{ fontSize: 13, padding: '11px 22px' }}>
                  View Resources
                </button>
              </Link>
            </div>

            {/* UPLOAD FORM */}
            <div className="panel" style={{ maxWidth: 800, padding: 40, background: 'rgba(20,20,20,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <h3 style={{ marginBottom: 30, fontSize: 20, fontWeight: 500, color: '#f0ece4', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>Resource Details</h3>
              <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                  <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,236,228,.6)', textTransform: 'uppercase', letterSpacing: 1 }}>Resource Name *</label>
                    <input type="text" placeholder="e.g. Q4 Strategy Document"
                      value={resourceName} onChange={(e) => setResourceName(e.target.value)}
                      className="upload-input" style={{ width: '100%', padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </div>

                  <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,236,228,.6)', textTransform: 'uppercase', letterSpacing: 1 }}>Privacy / Visibility</label>
                    <div style={{ display: 'flex', gap: 20, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '15px 16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', color: visibility === "public" ? '#fff' : 'rgba(240,236,228,.5)', fontWeight: visibility === "public" ? 600 : 400 }}>
                        <input type="radio" value="public" checked={visibility === "public"} onChange={(e) => setVisibility(e.target.value)} style={{ accentColor: '#ff1f5a', width: 16, height: 16 }} />
                        Public
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', color: visibility === "team_only" ? '#fff' : 'rgba(240,236,228,.5)', fontWeight: visibility === "team_only" ? 600 : 400 }}>
                        <input type="radio" value="team_only" checked={visibility === "team_only"} onChange={(e) => setVisibility(e.target.value)} style={{ accentColor: '#ff1f5a', width: 16, height: 16 }} />
                        Team Only
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,236,228,.6)', textTransform: 'uppercase', letterSpacing: 1 }}>Description</label>
                  <textarea placeholder="Brief description of this resource..."
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    rows={4} className="upload-input" style={{ width: '100%', padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(240,236,228,.6)', textTransform: 'uppercase', letterSpacing: 1 }}>Choose File *</label>
                  <div className={`file-drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault(); setDragOver(false);
                      if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
                    }}
                    style={{ minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--surface)' }}
                  >
                    <input id="file-input" type="file" onChange={(e) => setFile(e.target.files[0])}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{file ? '📄' : '📎'}</div>
                    <p style={{ fontSize: 15, fontWeight: 500, color: file ? '#fff' : 'rgba(240,236,228,.5)', marginBottom: 6 }}>
                      {file ? file.name : "Click to select or drag visually here"}
                    </p>
                    {file && (
                      <p style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600 }}>
                        {(file.size / 1024).toFixed(1)} KB Ready
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 10, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button type="submit" disabled={uploading} className={`upload-submit-btn ${uploading ? 'loading' : ''}`} style={{ width: '100%', padding: 20, fontSize: 16, fontWeight: 600 }}>
                    {uploading ? "Uploading..." : "⬆ Upload Resource"}
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default UploadResource;
