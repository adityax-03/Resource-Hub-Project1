import { useState, useEffect } from "react";
import api from "../services/api";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/notifications");
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.put("/api/notifications/read-all");
      fetchNotifications();
      setOpen(false);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="icon-btn" 
        onClick={() => setOpen(!open)}
        style={{ position: 'relative' }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            background: '#ff1f5a', color: '#fff',
            fontSize: '10px', fontWeight: 'bold',
            padding: '2px 6px', borderRadius: '10px',
            lineHeight: 1
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '120%', right: -10,
          width: 320, background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          zIndex: 9999, overflow: 'hidden', animation: 'fadeUp 0.3s ease-out forwards'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            <h4 style={{ margin: 0, fontSize: '15px' }}>Notifications</h4>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: '12px', cursor: 'pointer' }}
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <p style={{ padding: '30px 20px', textAlign: 'center', margin: 0, fontSize: '13px', color: 'rgba(240,236,228,0.4)' }}>
                No notifications yet.
              </p>
            ) : (
              notifications.map(n => (
                <div 
                  key={n._id}
                  onClick={() => !n.isRead && markAsRead(n._id)}
                  style={{
                    padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: n.isRead ? 'transparent' : 'rgba(255,255,255,0.03)',
                    cursor: n.isRead ? 'default' : 'pointer', transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: n.isRead ? 'rgba(240,236,228,0.7)' : '#fff' }}>
                      {n.title}
                    </span>
                    {!n.isRead && <span className="user-dot online" style={{ width: 6, height: 6 }} />}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: n.isRead ? 'rgba(240,236,228,0.4)' : 'rgba(240,236,228,0.7)', lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
