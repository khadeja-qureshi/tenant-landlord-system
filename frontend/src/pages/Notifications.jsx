import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/notificationAPI";
import { UI, BTN } from "../styles/ui";

export default function Notifications() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");

  const loadNotifications = async () => {
    try {
      const res = await getNotifications(user.id);
      setItems(res.data.data || []);
    } catch {
      setMessage("Failed to load notifications.");
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleRead = async (id) => {
    await markNotificationRead(id);
    loadNotifications();
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead(user.id);
    loadNotifications();
  };

  const backPath =
    user?.role === "admin"
      ? "/admin-dashboard"
      : user?.role === "landlord"
      ? "/landlord-dashboard"
      : "/tenant-dashboard";

  return (
    <div style={UI.page}>
      <nav style={UI.navbar}>
        <div style={UI.brand}>🏠 PropManager</div>
        <div style={UI.navActions}>
          <button onClick={() => navigate(backPath)} style={BTN.secondary}>Dashboard</button>
          <button onClick={handleReadAll} style={BTN.primary}>Mark all read</button>
        </div>
      </nav>

      <div style={UI.container}>
        <div style={{ ...UI.hero, marginBottom: 18 }}>
          <h1 style={UI.heroTitle}>Notifications</h1>
          <p style={UI.heroText}>Stay updated with request, dispute, assignment, and document activity.</p>
        </div>

        {message && <div style={UI.error}>{message}</div>}

        {items.length === 0 ? (
          <div style={UI.emptyBox}>No notifications yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((n) => (
              <div
                key={n.id}
                style={{
                  ...UI.card,
                  opacity: n.is_read ? 0.78 : 1,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{n.message}</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>

                  {!n.is_read && (
                    <button onClick={() => handleRead(n.id)} style={BTN.success}>
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}