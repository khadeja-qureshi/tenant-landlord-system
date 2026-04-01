import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/axios";
import { UI, BTN } from "../styles/ui";

export default function TenantDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    open: 0,
    progress: 0,
    resolved: 0,
  });

  const [property, setProperty] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    if (user?.id) {
      fetchStats();
      fetchMyProperty();
    }
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get(`/maintenance/tenant/${user.id}`);
      const requests = res.data.data || [];
      setStats({
        open: requests.filter((r) => r.status === "pending").length,
        progress: requests.filter((r) => r.status === "in_progress").length,
        resolved: requests.filter((r) => r.status === "resolved").length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyProperty = async () => {
    try {
      const res = await API.get(`/tenancy/tenant/${user.id}/my-property`);
      setProperty(res.data.data);
    } catch {
      setProperty(null);
    }
  };

  const cards = [
  {
    icon: "📋",
    title: "My Requests",
    desc: "Track all maintenance requests.",
    link: "/maintenance",
    label: "View Requests",
    btnStyle: BTN.linkPurple,
  },
  {
    icon: "🛠️",
    title: "New Request",
    desc: "Report a new issue quickly.",
    link: "/maintenance/new",
    label: "Create Request",
    btnStyle: BTN.linkGreen,
  },
  {
    icon: "🔔",
    title: "Notifications",
    desc: "See system and request alerts.",
    link: "/notifications",
    label: "Open Notifications",
    btnStyle: BTN.linkPrimary,
  },
  {
    icon: "💳",
    title: "Rent Payments",
    desc: "View rent history and record payments.",
    link: "/tenant/payments",
    label: "Open Payments",
    btnStyle: BTN.linkPrimary,
  },
  {
    icon: "🪪",
    title: "Verification Docs",
    desc: "Upload ID and personal documents.",
    link: "/tenant/verification-docs",
    label: "Manage Documents",
    btnStyle: {
      ...BTN.linkPrimary,
      background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
    },
  },
  {
    icon: "⚖️",
    title: "File Dispute",
    desc: "Raise a dispute on unresolved work.",
    link: "/tenant/file-dispute",
    label: "File Dispute",
    btnStyle: {
      ...BTN.linkPrimary,
      background: "linear-gradient(135deg, #ef4444, #f87171)",
    },
  },
  {
    icon: "📂",
    title: "My Disputes",
    desc: "Manage dispute status and docs.",
    link: "/tenant/disputes",
    label: "View Disputes",
    btnStyle: BTN.linkPurple,
  },
  {
    icon: "👤",
    title: "Profile",
    desc: "View your account details.",
    link: "/profile",
    label: "View Profile",
    btnStyle: {
      ...BTN.linkPrimary,
      background: "linear-gradient(135deg, #0891b2, #06b6d4)",
    },
  },
];

  return (
    <div style={UI.page}>
      <nav style={UI.navbar}>
        <div style={UI.brand}>🏠 PropManager</div>
        <div style={UI.navActions}>
          <span style={{ color: "#475569", fontSize: 14 }}>
            Hi, <b>{user?.name}</b>
          </span>
          <button onClick={() => navigate("/notifications")} style={BTN.secondary}>
            Notifications
          </button>
          <button onClick={handleLogout} style={BTN.danger}>
            Logout
          </button>
        </div>
      </nav>

      <div style={UI.container}>
        <div style={UI.hero}>
          <h1 style={UI.heroTitle}>Tenant Dashboard</h1>
          <p style={UI.heroText}>
            Manage requests, disputes, notifications, rent, and your assigned property.
          </p>
        </div>

        <div style={UI.infoBox}>
          <h3 style={{ ...UI.sectionTitle, marginBottom: 8 }}>My Property</h3>
          {property ? (
            <>
              <div style={UI.infoRow}><b>Address:</b> {property.address}</div>
              <div style={UI.infoRow}><b>Description:</b> {property.description || "—"}</div>
              <div style={UI.infoRow}><b>Landlord:</b> {property.landlord_name}</div>
              <div style={UI.infoRow}>
                <b>Contact:</b> {property.landlord_email} {property.landlord_phone ? `| ${property.landlord_phone}` : ""}
              </div>
              <div style={UI.infoRow}>
                <b>Monthly Rent:</b> {property.monthly_rent ? `PKR ${property.monthly_rent}` : "Not set"}
              </div>
            </>
          ) : (
            <div style={{ color: "#64748b" }}>No active property assigned yet.</div>
          )}
        </div>

        <div style={{ ...UI.grid3, marginBottom: 18 }}>
          <div style={UI.statCard}>
            <div style={UI.statValue}>🔴 {stats.open}</div>
            <div style={UI.statLabel}>Open Requests</div>
          </div>
          <div style={UI.statCard}>
            <div style={UI.statValue}>🟡 {stats.progress}</div>
            <div style={UI.statLabel}>In Progress</div>
          </div>
          <div style={UI.statCard}>
            <div style={UI.statValue}>🟢 {stats.resolved}</div>
            <div style={UI.statLabel}>Resolved</div>
          </div>
        </div>

        <h3 style={UI.sectionTitle}>Quick Actions</h3>

        <div style={UI.grid3}>
          {cards.map((c) => (
            <div key={c.title} style={UI.card}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{c.title}</div>
              <div style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5, marginBottom: 14 }}>
                {c.desc}
              </div>

              <Link to={c.link} style={c.btnStyle}>
                {c.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}