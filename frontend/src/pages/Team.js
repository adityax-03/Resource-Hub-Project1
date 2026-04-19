import { useEffect, useContext, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ThreeBackground from "../components/ThreeBackground";
import Cursor from "../components/Cursor";
import Toast from "../components/Toast";
import NotificationBell from "../components/NotificationBell";
import api from "../services/api";
import "../styles/dashboard.css";

// A user is "online" if active within the last 5 minutes
const isOnline = (lastActive) => {
  if (!lastActive) return false;
  return (Date.now() - new Date(lastActive).getTime()) < 5 * 60 * 1000;
};

function Team() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState({ message: "", type: "", show: false });
  const [addingMember, setAddingMember] = useState(null); // teamId for which we're adding

  const handleLogout = () => { logout(); navigate("/login"); };
  const getInitials = (name) => !name ? "??" : name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const fetchTeamData = useCallback(async () => {
    try {
      const [membersRes, teamsRes] = await Promise.all([
        api.get("/api/team/members"),
        api.get("/api/team/all"),
      ]);

      setMembers(membersRes.data.users || []);
      setTeams(teamsRes.data.teams || []);
    } catch (err) {
      console.error("Fetch team data error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeamData(); }, [fetchTeamData]);

  // Sidebar toggle
  useEffect(() => {
    const sidebar = document.getElementById("sidebar");
    const toggle = document.getElementById("sidebarToggle");
    const handler = () => sidebar?.classList.toggle("collapsed");
    toggle?.addEventListener("click", handler);
    return () => toggle?.removeEventListener("click", handler);
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    try {
      const res = await api.post("/api/team/create", { teamName });
      setToast({ message: res.data.message, type: "success", show: true });
      setTeamName("");
      fetchTeamData(); // Refresh
    } catch (error) {
      setToast({ message: error.response?.data?.message || "Failed to create team", type: "error", show: true });
    }
  };

  const handleAddMember = async (teamId, userId) => {
    try {
      const res = await api.post("/api/team/add-member", { teamId, userId });
      setToast({ message: res.data.message, type: "success", show: true });
      fetchTeamData(); // Refresh
    } catch (error) {
      setToast({ message: error.response?.data?.message || "Failed to add member", type: "error", show: true });
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    try {
      const res = await api.post("/api/team/remove-member", { teamId, userId });
      setToast({ message: res.data.message, type: "success", show: true });
      fetchTeamData();
    } catch (error) {
      setToast({ message: error.response?.data?.message || "Failed to remove member", type: "error", show: true });
    }
  };

  // Get members not yet in a specific team
  const getAvailableMembers = (team) => {
    const teamMemberIds = (team.members || []).map(m => m._id || m);
    return members.filter(m => !teamMemberIds.includes(m._id));
  };

  // Filter members based on search
  const filteredMembers = members.filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.username?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    );
  });

  const onlineCount = members.filter(m => isOnline(m.lastActive)).length;

  // Deterministic avatar colors based on member name
  const avatarColors = [
    ['#6c3fff', '#00d4c8'], ['#ff1f5a', '#6c3fff'], ['#00d4c8', '#ff4d1c'],
    ['#ff4d1c', '#4f8cff'], ['#4f8cff', '#ff1f5a'], ['#34d399', '#ffb347']
  ];
  const getAvatarGradient = (name) => {
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const idx = Math.abs(hash) % avatarColors.length;
    return `linear-gradient(135deg, ${avatarColors[idx][0]}, ${avatarColors[idx][1]})`;
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
            <div className="nav-item active">
              <span className="nav-icon">👥</span><span>Team</span>
            </div>
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
                  placeholder="Search team members..."
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
                <h2 className="welcome-name">👥 Team Management</h2>
                <p className="welcome-sub">View your team and manage members.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="user-dot online" style={{ width: 8, height: 8 }} />
                  {onlineCount} online
                </span>
                {isAdmin && (
                  <span className="role-badge admin" style={{ fontSize: 12, padding: '6px 16px' }}>
                    <span className="role-dot" />Admin Access
                  </span>
                )}
              </div>
            </div>

            {/* CREATE TEAM — For any user */}
            <div className="admin-panel" style={{ marginTop: 0, marginBottom: 24 }}>
              <div className="admin-panel-header">
                <h3>➕ Create New Team</h3>
              </div>
                <form onSubmit={handleCreateTeam} style={{
                  display: 'flex', gap: 12, alignItems: 'center', marginTop: 8
                }}>
                  <input
                    type="text" placeholder="Enter team name..."
                    value={teamName} onChange={(e) => setTeamName(e.target.value)}
                    style={{
                      flex: 1, background: 'rgba(255,255,255,.06)',
                      border: '1px solid rgba(255,255,255,.12)', borderRadius: 12,
                      padding: '12px 16px', fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontSize: 14, color: '#f0ece4', outline: 'none'
                    }}
                  />
                  <button type="submit" className="admin-btn" style={{
                    padding: '12px 24px', whiteSpace: 'nowrap'
                  }}>Create Team</button>
                </form>
              </div>

            {/* TEAMS LIST */}
            {teams.length > 0 && (
              <div className="panel" style={{ marginBottom: 16 }}>
                <h3>Teams ({teams.length})</h3>
                <div className="team-list">
                  {teams.map((team) => (
                    <div key={team._id} style={{
                      padding: '16px', borderRadius: 12,
                      background: 'rgba(255,255,255,.03)',
                      border: '1px solid rgba(255,255,255,.05)',
                      marginBottom: 8
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: team.members?.length > 0 || (isAdmin && addingMember === team._id) ? 12 : 0
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span className="user-dot online" />
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#f0ece4' }}>{team.teamName}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 11, opacity: 0.4 }}>
                            {team.members?.length || 0} members
                          </span>
                          {/* Users can add members to a team if they belong to it or created it */}
                          <button
                            onClick={() => setAddingMember(addingMember === team._id ? null : team._id)}
                            className="action-btn download-btn"
                            style={{ fontSize: 11, padding: '4px 10px' }}
                          >
                            {addingMember === team._id ? '✕ Close' : '➕ Add'}
                          </button>
                        </div>
                      </div>

                      {/* Team members list */}
                      {team.members?.length > 0 && (
                        <div style={{
                          display: 'flex', flexWrap: 'wrap', gap: 6,
                          marginBottom: addingMember === team._id ? 12 : 0
                        }}>
                          {team.members.map((m) => {
                            const isCreatorObj = m._id && (team.createdBy?._id === m._id || team.createdBy === m._id);
                            const isCreatorStr = !m._id && (team.createdBy === m);
                            const isCreator = isCreatorObj || isCreatorStr;
                            
                            const amIAdminOrCreator = isAdmin || 
                              team.createdBy?._id === user?._id || 
                              team.createdBy === user?._id;

                            return (
                              <div key={m._id || m} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                fontSize: 11, padding: '4px 10px', borderRadius: 8,
                                background: 'rgba(255,255,255,.06)', color: 'rgba(240,236,228,.6)'
                              }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {m.name || m.username || m}
                                  {m.name && m.username && <span style={{ opacity: 0.4, fontSize: 10, fontWeight: 400 }}>(@{m.username})</span>}
                                </span>
                                {isCreator && <span style={{ color: '#ffb800', fontWeight: 600, fontSize: 10 }}>Team Admin</span>}
                                {amIAdminOrCreator && !isCreator && (
                                  <button 
                                    onClick={() => handleRemoveMember(team._id, m._id || m)}
                                    style={{ background: 'none', border: 'none', color: '#ff1f5a', cursor: 'pointer', fontSize: 10, padding: 0, marginLeft: 4 }}
                                    title="Remove Member"
                                  >✕</button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add member dropdown */}
                      {addingMember === team._id && (
                        <div style={{
                          borderTop: '1px solid rgba(255,255,255,.06)',
                          paddingTop: 12
                        }}>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                            Select a user to add:
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                            {getAvailableMembers(team).length === 0 ? (
                              <p style={{ fontSize: 12, opacity: 0.4, fontStyle: 'italic' }}>
                                All users are already in this team
                              </p>
                            ) : (
                              getAvailableMembers(team).map(m => (
                                <div key={m._id} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '8px 12px', borderRadius: 8,
                                  background: 'rgba(255,255,255,.04)',
                                  border: '1px solid rgba(255,255,255,.06)'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                      width: 26, height: 26, borderRadius: 6,
                                      background: getAvatarGradient(m.name),
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 10, fontWeight: 700, color: '#fff'
                                    }}>
                                      {getInitials(m.name)}
                                    </div>
                                    <div>
                                      <span style={{ fontSize: 13, color: '#f0ece4' }}>{m.name}</span>
                                      <span style={{ fontSize: 11, color: 'rgba(240,236,228,.3)', marginLeft: 8 }}>@{m.username}</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleAddMember(team._id, m._id)}
                                    className="action-btn download-btn"
                                    style={{ fontSize: 11, padding: '4px 12px' }}
                                  >
                                    Add
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search results info */}
            {searchQuery.trim() && (
              <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                Found {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} for "{searchQuery}"
              </div>
            )}

            {/* ALL MEMBERS */}
            <div className="panel" style={{ marginBottom: 16 }}>
              <h3>All Members ({members.length})</h3>
              <div className="team-list">
                {loading ? (
                  <div className="team-user" style={{ opacity: 0.4 }}>Loading members...</div>
                ) : filteredMembers.length === 0 ? (
                  <div className="team-user" style={{ opacity: 0.4 }}>
                    {searchQuery.trim() ? "No members match your search" : "No registered members yet"}
                  </div>
                ) : (
                  filteredMembers.map((member) => {
                    const online = isOnline(member.lastActive);
                    return (
                      <div key={member._id} className="team-user" style={{
                        padding: '12px 16px', borderRadius: 12,
                        background: 'rgba(255,255,255,.03)',
                        border: '1px solid rgba(255,255,255,.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span className={`user-dot ${online ? 'online' : 'offline'}`} />
                          <div>
                            <span style={{ fontSize: 14, color: '#f0ece4', display: 'block' }}>{member.name}</span>
                            <span style={{ fontSize: 11, color: 'rgba(240,236,228,.3)' }}>@{member.username}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, color: online ? 'var(--teal)' : 'rgba(240,236,228,.3)' }}>
                            {online ? 'Online' : 'Offline'}
                          </span>
                          <span className={`role-badge ${member.role}`} style={{ fontSize: 10, padding: '3px 10px' }}>
                            <span className="role-dot" />{member.role}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default Team;
