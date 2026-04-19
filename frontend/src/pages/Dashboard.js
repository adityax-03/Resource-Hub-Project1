import { useEffect, useContext, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ThreeBackground from "../components/ThreeBackground";
import Cursor from "../components/Cursor";
import Toast from "../components/Toast";
import NotificationBell from "../components/NotificationBell";
import api from "../services/api";
import "../styles/dashboard.css";

// A user is "online" if active within the last 5 minutes
const isUserOnline = (lastActive) => {
  if (!lastActive) return false;
  return (Date.now() - new Date(lastActive).getTime()) < 5 * 60 * 1000;
};

// Deterministic avatar colors based on name (no random flickering)
const avatarColorPairs = [
  ['#6c3fff', '#00d4c8'], ['#ff1f5a', '#6c3fff'], ['#00d4c8', '#ff4d1c'],
  ['#ff4d1c', '#4f8cff'], ['#4f8cff', '#ff1f5a'], ['#34d399', '#ffb347']
];
const getAvatarGradient = (name) => {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const idx = Math.abs(hash) % avatarColorPairs.length;
  return `linear-gradient(135deg, ${avatarColorPairs[idx][0]}, ${avatarColorPairs[idx][1]})`;
};

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [stats, setStats] = useState({ totalResources: 0, totalMembers: 0, uploadsThisWeek: 0, totalDownloads: 0 });
  const [recentResources, setRecentResources] = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState({ message: "", type: "", show: false });

  const handleLogout = () => { logout(); navigate("/login"); };

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, resourcesRes, membersRes] = await Promise.all([
        api.get("/api/resource/stats"),
        api.get("/api/resource/all"),
        api.get("/api/team/members"),
      ]);

      setStats({
        totalResources: statsRes.data.totalResources || 0,
        totalMembers: membersRes.data.count || 0,
        uploadsThisWeek: statsRes.data.uploadsThisWeek || 0,
        totalDownloads: statsRes.data.totalDownloads || 0,
      });

      const resources = resourcesRes.data.resources || [];
      setAllResources(resources);
      setRecentResources(resources.slice(0, 5));
      setMembers(membersRes.data.users || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  /* ── Sidebar toggle ── */
  useEffect(() => {
    const sidebar = document.getElementById("sidebar");
    const toggle = document.getElementById("sidebarToggle");
    const handler = () => sidebar?.classList.toggle("collapsed");
    toggle?.addEventListener("click", handler);
    return () => toggle?.removeEventListener("click", handler);
  }, []);

  /* ── Animated counters ── */
  useEffect(() => {
    if (loading) return;
    document.querySelectorAll(".stat-value").forEach((el) => {
      const target = +el.dataset.target;
      if (!target) return;
      let count = 0;
      const step = () => {
        count += target / 40;
        if (count < target) { el.textContent = Math.floor(count); requestAnimationFrame(step); }
        else el.textContent = target;
      };
      step();
    });
  }, [loading, stats]);

  const getInitials = (name) => !name ? "??" : name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const getFirstName = (name) => !name ? "User" : name.split(" ")[0];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  // Search — filters recent resources shown in dashboard
  const filteredResources = searchQuery.trim()
    ? allResources.filter(r => {
        const q = searchQuery.toLowerCase();
        return (
          r.resourceName?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          (r.uploadedBy?.name || "").toLowerCase().includes(q)
        );
      }).slice(0, 5)
    : recentResources;

  const onlineMembers = members.filter(m => isUserOnline(m.lastActive));

  const statIcons = ["📄", "👥", "📊", "⬆"];
  const statColors = [
    "rgba(79, 140, 255, 0.12)",
    "rgba(255, 31, 90, 0.12)",
    "rgba(52, 211, 153, 0.12)",
    "rgba(255, 77, 28, 0.12)"
  ];

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
            <div className="nav-item active">
              <span className="nav-icon">📊</span><span>Dashboard</span>
            </div>
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

          {/* TOPBAR */}
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

          {/* CONTENT */}
          <div className="page-content page-enter">

            {/* WELCOME */}
            <div className="welcome-banner">
              <div>
                <p className="welcome-label">{getGreeting()} 👋</p>
                <h2 className="welcome-name">
                  Welcome back, <span>{getFirstName(user?.name)}</span>
                </h2>
                <p className="welcome-sub">Here's what's happening with your workspace today.</p>
              </div>
              <Link to="/upload" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary">+ Upload Resource</button>
              </Link>
            </div>

            {/* STATS */}
            <div className="stats-grid">
              {[
                { label: "TOTAL RESOURCES", value: stats.totalResources },
                { label: "TEAM MEMBERS", value: stats.totalMembers },
                { label: "TOTAL DOWNLOADS", value: stats.totalDownloads },
                { label: "UPLOADS THIS WEEK", value: stats.uploadsThisWeek },
              ].map((s, i) => (
                <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="stat-label">{s.label}</span>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: statColors[i],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16
                    }}>
                      {statIcons[i]}
                    </div>
                  </div>
                  <span className="stat-value" data-target={s.value}>0</span>
                </div>
              ))}
            </div>

            {/* PANELS */}
            <div className="panel-grid">

              {/* RECENT RESOURCES */}
              <div className="panel">
                <h3>
                  {searchQuery.trim() ? 'Search Results' : 'Recent Resources'}
                  <Link to="/resources" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 400 }}>View all</Link>
                </h3>
                <div className="resource-list">
                  {loading ? (
                    <div className="resource-item" style={{ opacity: 0.4 }}>Loading...</div>
                  ) : filteredResources.length === 0 ? (
                    <div className="resource-item" style={{ opacity: 0.4 }}>
                      {searchQuery.trim() ? "No resources match your search" : "No resources yet. Upload your first!"}
                    </div>
                  ) : (
                    filteredResources.map((r) => (
                      <div key={r._id} className="resource-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 16 }}>📄</span>
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{r.resourceName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              v{r.version} · {r.uploadedBy?.name || 'Unknown'}
                            </div>
                          </div>
                        </div>
                        <span className="version-badge">v{r.version}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN — Team + Activity stacked */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* TEAM MEMBERS */}
                <div className="panel">
                  <h3>
                    Team Online
                    <span style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="user-dot online" style={{ width: 6, height: 6 }} />
                      {onlineMembers.length} online
                    </span>
                  </h3>
                  <div className="team-list">
                    {loading ? (
                      <div className="team-user" style={{ opacity: 0.4 }}>Loading...</div>
                    ) : members.length === 0 ? (
                      <div className="team-user" style={{ opacity: 0.4 }}>No members yet</div>
                    ) : (
                      members.slice(0, 6).map((m) => {
                        const online = isUserOnline(m.lastActive);
                        return (
                          <div key={m._id} className="team-user" style={{ padding: '6px 0' }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: getAvatarGradient(m.name),
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0
                            }}>
                              {getInitials(m.name)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{m.name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{m.role || 'member'}</div>
                                {m.username && <div style={{ fontSize: 10, color: 'rgba(240,236,228,.3)' }}>• @{m.username}</div>}
                              </div>
                            </div>
                            <span className={`user-dot ${online ? 'online' : 'offline'}`} title={online ? 'Online' : 'Offline'} />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* ACTIVITY */}
                <div className="panel">
                  <h3>
                    Activity
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>See all</span>
                  </h3>
                  <div className="activity-list">
                    {loading ? (
                      <div className="activity-item" style={{ opacity: 0.4 }}>Loading...</div>
                    ) : recentResources.length === 0 ? (
                      <div className="activity-item" style={{ opacity: 0.4 }}>No activity yet</div>
                    ) : (
                      recentResources.slice(0, 4).map((r) => (
                        <div key={r._id} className="activity-item">
                          <strong style={{ color: 'var(--text-primary)' }}>{r.uploadedBy?.name || "Someone"}</strong> uploaded {r.resourceName}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ADMIN PANEL */}
            {isAdmin && (
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h3>🛡 Admin Controls</h3>
                  <span className="admin-panel-badge">Admin Only</span>
                </div>
                <div className="admin-actions">
                  <Link to="/team" style={{ textDecoration: 'none' }}>
                    <button className="admin-btn">➕ Create Team</button>
                  </Link>
                  <Link to="/resources" style={{ textDecoration: 'none' }}>
                    <button className="admin-btn">🗑 Manage Resources</button>
                  </Link>
                  <Link to="/team" style={{ textDecoration: 'none' }}>
                    <button className="admin-btn">👥 Manage Members</button>
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;