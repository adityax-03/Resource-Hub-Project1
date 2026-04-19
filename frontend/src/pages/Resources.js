import { useEffect, useContext, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ThreeBackground from "../components/ThreeBackground";
import Cursor from "../components/Cursor";
import Toast from "../components/Toast";
import NotificationBell from "../components/NotificationBell";
import api, { API_BASE } from "../services/api";
import "../styles/dashboard.css";

function Resources() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState({ message: "", type: "", show: false });

  const handleLogout = () => { logout(); navigate("/login"); };
  const getInitials = (name) => !name ? "??" : name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const fetchResources = useCallback(async () => {
    try {
      const res = await api.get("/api/resource/all");
      setResources(res.data.resources || []);
    } catch (err) {
      console.error("Fetch resources error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  // Sidebar toggle
  useEffect(() => {
    const sidebar = document.getElementById("sidebar");
    const toggle = document.getElementById("sidebarToggle");
    const handler = () => sidebar?.classList.toggle("collapsed");
    toggle?.addEventListener("click", handler);
    return () => toggle?.removeEventListener("click", handler);
  }, []);

  const handleDelete = async (resourceId, resourceName) => {
    if (!window.confirm(`Delete "${resourceName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/resource/delete/${resourceId}`);
      setToast({ message: "Resource deleted successfully", type: "success", show: true });
      fetchResources(); // Refresh the list
    } catch (error) {
      setToast({ message: error.response?.data?.message || "Failed to delete", type: "error", show: true });
    }
  };

  const handleDownload = (resource) => {
    const token = localStorage.getItem("token");
    // Always use the backend download endpoint — it handles both local and Cloudinary files
    const url = `${API_BASE}/api/resource/download/${resource._id}`;
    // Open in new tab with auth — for direct download we need a different approach
    // Use fetch to get the file and trigger download
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        if (!response.ok) throw new Error("Download failed");
        // Check if it's a redirect (Cloudinary)
        if (response.redirected) {
          window.open(response.url, "_blank");
          return null;
        }

        let filename = resource.resourceName || "download";
        const contentDisposition = response.headers.get("content-disposition");
        if (contentDisposition && contentDisposition.includes("filename=")) {
          const match = contentDisposition.match(/filename="?([^";]+)"?/);
          if (match && match[1]) {
            filename = match[1];
          }
        } else {
          // Fallback to inferring from URLs
          const pathStr = resource.fileUrl || resource.filePath || resource.cloudinaryId || "";
          const match = pathStr.match(/\.[0-9a-z]+$/i);
          if (match && !filename.toLowerCase().endsWith(match[0].toLowerCase())) {
            filename += match[0];
          }
        }
        
        return response.blob().then(blob => ({ blob, filename }));
      })
      .then(result => {
        if (!result) return;
        const { blob, filename } = result;
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(err => {
        console.error("Download error:", err);
        setToast({ message: "Download failed", type: "error", show: true });
      });
  };

  const getUploaderName = (resource) => {
    if (resource.uploadedBy?.name) return resource.uploadedBy.name;
    if (typeof resource.uploadedBy === "string") return resource.uploadedBy;
    return "Unknown";
  };

  // Filter resources based on search query
  const filteredResources = resources.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.resourceName?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      (r.uploadedBy?.name || "").toLowerCase().includes(q)
    );
  });

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
            <div className="nav-item active">
              <span className="nav-icon">📁</span><span>Resources</span>
            </div>
            <Link to="/team" style={{ textDecoration: 'none' }}>
              <div className="nav-item"><span className="nav-icon">👥</span><span>Team</span></div>
            </Link>
            <Link to="/upload" style={{ textDecoration: 'none' }}>
              <div className="nav-item"><span className="nav-icon">⬆</span><span>Upload</span></div>
            </Link>
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
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
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

          {/* PAGE CONTENT */}
          <div className="page-content page-enter">

            <div className="welcome-banner">
              <div>
                <h2 className="welcome-name">📁 Resources</h2>
                <p className="welcome-sub">Browse, download, and manage shared resources.</p>
              </div>
              <Link to="/upload" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary">Upload Resource</button>
              </Link>
            </div>

            {/* Search results info */}
            {searchQuery.trim() && (
              <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                Found {filteredResources.length} result{filteredResources.length !== 1 ? 's' : ''} for "{searchQuery}"
              </div>
            )}

            {/* RESOURCE CARDS */}
            {loading ? (
              <div className="panel" style={{ textAlign: "center", padding: 48 }}>
                <p style={{ fontSize: 14, opacity: 0.5 }}>Loading resources...</p>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="panel" style={{ textAlign: "center", padding: 48 }}>
                <p style={{ fontSize: 48, marginBottom: 12 }}>📂</p>
                <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                  {searchQuery.trim() ? "No resources match your search" : "No resources yet"}
                </p>
                <p style={{ fontSize: 13, opacity: 0.4 }}>
                  {searchQuery.trim() ? "Try a different search term." : "Upload your first resource to get started."}
                </p>
                {!searchQuery.trim() && (
                  <Link to="/upload" style={{ textDecoration: 'none' }}>
                    <button className="btn btn-primary" style={{ marginTop: 20 }}>Upload Resource</button>
                  </Link>
                )}
              </div>
            ) : (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 16
              }}>
                {filteredResources.map((resource, i) => (
                  <div key={resource._id} className="panel resource-card" style={{
                    position: 'relative', animationDelay: `${i * 0.08}s`
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                      marginBottom: 12
                    }}>
                      <h3 style={{ marginBottom: 0, fontSize: 15 }}>{resource.resourceName}</h3>
                      <span className="version-badge">v{resource.version}</span>
                    </div>
                    <p style={{
                      fontSize: 13, color: 'rgba(240,236,228,.4)',
                      lineHeight: 1.5, marginBottom: 16
                    }}>
                      {resource.description || "No description"}
                    </p>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 12
                    }}>
                      <span style={{ fontSize: 12, color: 'rgba(240,236,228,.3)' }}>
                        By {getUploaderName(resource)} · ⬇ {resource.downloadCount || 0}
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleDownload(resource)} className="action-btn download-btn">
                          ⬇ Download
                        </button>
                        {(isAdmin || (resource.uploadedBy && (resource.uploadedBy._id || resource.uploadedBy) === user._id)) && (
                          <button
                            onClick={() => handleDelete(resource._id, resource.resourceName)}
                            className="action-btn delete-btn"
                          >
                            🗑 Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

export default Resources;
