import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserDisputes } from "../../api/disputeAPI";
import { getDisputeEvidence } from "../../api/evidenceAPI";
import DocumentManager from "../../components/DocumentManager";

export default function MyDisputes() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [evidenceMap, setEvidenceMap] = useState({});

  useEffect(() => {
    getUserDisputes(user.id)
      .then((res) => setDisputes(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadEvidence = async (disputeId) => {
    try {
      const res = await getDisputeEvidence(disputeId);
      setEvidenceMap((prev) => ({ ...prev, [disputeId]: res.data.data || [] }));
    } catch {
      setEvidenceMap((prev) => ({ ...prev, [disputeId]: [] }));
    }
  };

  const toggleEvidence = async (disputeId) => {
    if (expandedId === disputeId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(disputeId);
    if (!evidenceMap[disputeId]) {
      await loadEvidence(disputeId);
    }
  };

  const statusColor = (s) =>
    s === "resolved"
      ? { bg: "#f0fdf4", color: "#16a34a" }
      : s === "under_review"
      ? { bg: "#dbeafe", color: "#1d4ed8" }
      : s === "closed"
      ? { bg: "#f3f4f6", color: "#6b7280" }
      : { bg: "#fef9c3", color: "#854d0e" };

  return (
    <div style={S.page}>
      <nav style={S.navbar}>
        <div style={S.brand}>🏠 PropManager</div>
        <div style={S.navActions}>
          <button onClick={() => navigate("/tenant-dashboard")} style={S.secondaryBtn}>Dashboard</button>
          <button onClick={() => navigate("/tenant/file-dispute")} style={S.primaryBtn}>New Dispute</button>
          <button onClick={() => navigate("/notifications")} style={S.primaryBtn}>Notifications</button>
          <button onClick={() => { localStorage.removeItem("user"); navigate("/"); }} style={S.dangerBtn}>Logout</button>
        </div>
      </nav>

      <div style={S.container}>
        <div style={S.hero}>
          <h1 style={S.heroTitle}>My Disputes</h1>
          <p style={S.heroText}>Track dispute status and manage supporting documents.</p>
        </div>

        {loading && <p style={{ color: "#64748b" }}>Loading...</p>}

        {!loading && disputes.length === 0 && (
          <div style={S.emptyBox}>
            <div style={{ fontSize: 48 }}>📭</div>
            <p style={{ color: "#64748b" }}>No disputes filed yet.</p>
          </div>
        )}

        <div style={S.list}>
          {disputes.map((d) => {
            const sc = statusColor(d.status);

            return (
              <div key={d.dispute_id} style={S.card}>
                <div style={S.cardTop}>
                  <div>
                    <div style={S.cardTitle}>Dispute #{d.dispute_id}</div>
                    <div style={S.cardMeta}>Request: {d.request_title}</div>
                  </div>

                  <span style={{ ...S.badge, background: sc.bg, color: sc.color }}>
                    {d.status.replace("_", " ")}
                  </span>
                </div>

                <p style={S.description}>{d.description}</p>

                <div style={S.metaRow}>
                  <span>📅 Filed: {new Date(d.created_at).toLocaleDateString()}</span>
                  {d.mediator_name && <span>👤 Mediator: {d.mediator_name}</span>}
                  {d.resolved_at && <span>✅ Resolved: {new Date(d.resolved_at).toLocaleDateString()}</span>}
                </div>

                {d.resolution && (
                  <div style={S.resolutionBox}>
                    <b>Resolution:</b> {d.resolution}
                  </div>
                )}

                <div style={{ marginTop: 14 }}>
                  <button style={S.secondaryBtn} onClick={() => toggleEvidence(d.dispute_id)}>
                    {expandedId === d.dispute_id ? "Hide Documents" : "Manage Documents"}
                  </button>
                </div>

                {expandedId === d.dispute_id && (
                  <DocumentManager
                    user={user}
                    title={`Dispute Documents ${d.dispute_id}`}
                    documents={evidenceMap[d.dispute_id] || []}
                    refreshDocuments={() => loadEvidence(d.dispute_id)}
                    disputeId={d.dispute_id}
                    defaultCategory="dispute_evidence"
                    allowUpload={true}
                    allowEdit={true}
                    allowDelete={true}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#f1f5f9", fontFamily: "Inter, sans-serif" },
  navbar: {
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    padding: "0 32px",
    height: 70,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { fontWeight: 800, fontSize: 20, color: "#0f172a" },
  navActions: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  container: { maxWidth: 980, margin: "0 auto", padding: "28px 20px 40px" },
  hero: {
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
    color: "#fff",
    borderRadius: 20,
    padding: 28,
    marginBottom: 20,
  },
  heroTitle: { margin: 0, fontSize: 28, fontWeight: 800 },
  heroText: { marginTop: 8, marginBottom: 0, opacity: 0.95 },
  list: { display: "flex", flexDirection: "column", gap: 16 },
  card: {
    background: "#fff",
    borderRadius: 18,
    padding: 20,
    border: "1px solid #e2e8f0",
    boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  cardTitle: { fontSize: 18, fontWeight: 800, color: "#0f172a" },
  cardMeta: { marginTop: 4, fontSize: 13, color: "#64748b" },
  badge: { padding: "5px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
  description: { marginTop: 12, color: "#475569", lineHeight: 1.6 },
  metaRow: { marginTop: 10, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: "#64748b" },
  resolutionBox: { marginTop: 12, padding: "12px 14px", background: "#f0fdf4", borderRadius: 12, color: "#166534" },
  primaryBtn: { padding: "10px 16px", border: "none", borderRadius: 12, background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" },
  secondaryBtn: { padding: "10px 16px", border: "none", borderRadius: 12, background: "#e2e8f0", color: "#0f172a", fontWeight: 700, cursor: "pointer" },
  dangerBtn: { padding: "10px 16px", border: "none", borderRadius: 12, background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer" },
  emptyBox: { background: "#fff", borderRadius: 20, padding: 50, textAlign: "center", border: "1px solid #e2e8f0" },
};