import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { getRequestEvidence } from "../api/evidenceAPI";
import DocumentManager from "../components/DocumentManager";
import AssignProviderModal from "../components/AssignProviderModal";
import { UI, BTN } from "../styles/ui";

const priorityBadge = {
  high: { bg: "#fef2f2", color: "#dc2626" },
  medium: { bg: "#fffbeb", color: "#d97706" },
  low: { bg: "#f0fdf4", color: "#16a34a" },
};

const statusBadge = {
  pending: { bg: "#eff6ff", color: "#2563eb" },
  in_progress: { bg: "#fffbeb", color: "#d97706" },
  completed: { bg: "#e0f2fe", color: "#0369a1" },
  resolved: { bg: "#f0fdf4", color: "#16a34a" },
  disputed: { bg: "#f3e8ff", color: "#7c3aed" },
};

export default function MaintenanceList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [evidenceMap, setEvidenceMap] = useState({});
  const [message, setMessage] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [providerModalOpen, setProviderModalOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const isLandlord = user?.role === "landlord";
  const isTenant = user?.role === "tenant";

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleDashboard = () => {
    if (user?.role === "tenant") navigate("/tenant-dashboard");
    else if (user?.role === "landlord") navigate("/landlord-dashboard");
    else if (user?.role === "admin") navigate("/admin-dashboard");
    else if (user?.role === "mediator") navigate("/mediator-dashboard");
    else navigate("/");
  };

  const fetchRequests = async () => {
    try {
      const url = isTenant ? `/maintenance/tenant/${user.id}` : `/maintenance/`;
      const res = await API.get(url);
      let data = res.data?.data || [];

      if (isLandlord) {
        data = data.filter((r) => Number(r.landlord_id) === Number(user.id));
      }

      setRequests(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (requestId) => {
    try {
      const res = await getRequestEvidence(requestId);
      setEvidenceMap((prev) => ({ ...prev, [requestId]: res.data.data || [] }));
    } catch {
      setEvidenceMap((prev) => ({ ...prev, [requestId]: [] }));
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (requests.length) {
      requests.forEach((r) => {
        if (!evidenceMap[r.id]) {
          loadDocuments(r.id);
        }
      });
    }
  }, [requests]);

  const normalizeStatus = (status) => status?.replace("-", "_");

  const filtered =
    filter === "all"
      ? requests
      : requests.filter((r) => normalizeStatus(r.status) === filter);

  const openProviderModal = (item) => {
    setSelectedRequest(item);
    setProviderModalOpen(true);
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      await API.put(`/maintenance/${requestId}/status`, {
        status,
        user_id: user.id,
      });
      setMessage(`Request status updated to '${status}'.`);
      fetchRequests();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update request status.");
    }
  };

  const handleTenantDecision = async (requestId, decision) => {
    try {
      await API.put(`/maintenance/${requestId}/tenant-decision`, {
        user_id: user.id,
        decision,
      });
      setMessage(
        decision === "approve"
          ? "You approved the completed work."
          : "You rejected the completed work."
      );
      fetchRequests();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to record your decision.");
    }
  };

  return (
    <div style={UI.page}>
      <nav style={UI.navbar}>
        <div style={UI.brand}>🏠 PropManager</div>

        <div style={UI.navActions}>
          <span style={{ color: "#475569", fontSize: 14 }}>
            Hi, <b>{user?.name}</b>
          </span>

          <button onClick={handleDashboard} style={BTN.secondary}>
            Dashboard
          </button>

          <button onClick={() => navigate("/notifications")} style={BTN.primary}>
            Notifications
          </button>

          {isTenant && (
            <Link to="/maintenance/new" style={BTN.linkPurple}>
              + New Request
            </Link>
          )}

          <button onClick={handleLogout} style={BTN.danger}>
            Logout
          </button>
        </div>
      </nav>

      <div style={UI.container}>
        <div style={UI.hero}>
          <h1 style={UI.heroTitle}>Maintenance Requests</h1>
          <p style={UI.heroText}>
            {requests.length} total request{requests.length !== 1 ? "s" : ""}
          </p>
        </div>

        {message && <div style={UI.message}>{message}</div>}
        {error && <div style={UI.error}>{error}</div>}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          {["all", "pending", "in_progress", "completed", "resolved"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                ...BTN.secondary,
                background: filter === s ? "#dbeafe" : "#fff",
                borderColor: filter === s ? "#93c5fd" : "#dbe3ef",
                color: filter === s ? "#1d4ed8" : "#0f172a",
              }}
            >
              {s.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: "#64748b" }}>Loading...</p>}

        {!loading && !error && filtered.length === 0 && (
          <div style={UI.emptyBox}>No requests found.</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((item) => {
            const p = priorityBadge[item.priority] || priorityBadge.medium;
            const s = statusBadge[normalizeStatus(item.status)] || statusBadge.pending;

            return (
              <div key={item.id} style={UI.card}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{item.title}</div>
                    <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                      📍 {item.property_address || `Property #${item.property_id}`} • 🆔 #{item.id}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        padding: "5px 10px",
                        borderRadius: 999,
                        fontWeight: 700,
                        background: p.bg,
                        color: p.color,
                        fontSize: 12,
                      }}
                    >
                      {item.priority?.toUpperCase()}
                    </span>
                    <span
                      style={{
                        padding: "5px 10px",
                        borderRadius: 999,
                        fontWeight: 700,
                        background: s.bg,
                        color: s.color,
                        fontSize: 12,
                      }}
                    >
                      {item.status?.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 12, color: "#475569", lineHeight: 1.6 }}>
                  {item.description}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    gap: 14,
                    flexWrap: "wrap",
                    color: "#64748b",
                    fontSize: 13,
                  }}
                >
                  {item.category && <span>🏷 {item.category}</span>}
                  {item.created_at && (
                    <span>🕒 {new Date(item.created_at).toLocaleString()}</span>
                  )}
                  {!isTenant && item.tenant_name && <span>👤 {item.tenant_name}</span>}
                  {!isTenant && item.tenant_email && <span>✉️ {item.tenant_email}</span>}
                </div>

                {isLandlord && (
                  <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      style={{
                        ...BTN.primary,
                        background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
                      }}
                      onClick={() => openProviderModal(item)}
                    >
                      Assign Provider
                    </button>

                    <button
                      style={{ ...BTN.warning, background: "#f59e0b" }}
                      onClick={() => updateRequestStatus(item.id, "pending")}
                    >
                      Pending
                    </button>

                    <button
                      style={{ ...BTN.primary, background: "#3b82f6" }}
                      onClick={() => updateRequestStatus(item.id, "in_progress")}
                    >
                      In Progress
                    </button>

                    <button
                      style={{ ...BTN.secondary, background: "#0ea5e9", color: "#fff", border: "none" }}
                      onClick={() => updateRequestStatus(item.id, "completed")}
                    >
                      Completed
                    </button>
                  </div>
                )}

                {isTenant && item.status === "completed" && (
                  <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      style={BTN.success}
                      onClick={() => handleTenantDecision(item.id, "approve")}
                    >
                      Approve Work
                    </button>

                    <button
                      style={BTN.danger}
                      onClick={() => handleTenantDecision(item.id, "reject")}
                    >
                      Reject Work
                    </button>
                  </div>
                )}

                <div style={{ marginTop: 14 }}>
                  <DocumentManager
                    user={user}
                    title={isTenant ? `My Evidence ${item.id}` : `Tenant Evidence ${item.id}`}
                    documents={evidenceMap[item.id] || []}
                    refreshDocuments={() => loadDocuments(item.id)}
                    requestId={item.id}
                    defaultCategory="maintenance_evidence"
                    allowUpload={isTenant}
                    allowEdit={isTenant}
                    allowDelete={isTenant}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AssignProviderModal
        isOpen={providerModalOpen}
        onClose={() => {
          setProviderModalOpen(false);
          setSelectedRequest(null);
        }}
        requestItem={selectedRequest}
        user={user}
        onAssigned={fetchRequests}
      />
    </div>
  );
}