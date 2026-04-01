import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllDisputes,
  assignMediatorToDispute,
  resolveDispute,
} from "../../api/disputeAPI";
import API from "../../api/axios";
import { UI, BTN } from "../../styles/ui";

export default function AdminDisputes() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [mediators, setMediators] = useState([]);
  const [message, setMessage] = useState("");
  const [mediatorMap, setMediatorMap] = useState({});
  const [resolutionMap, setResolutionMap] = useState({});

  const loadData = async () => {
    try {
      const [disputeRes, mediatorRes] = await Promise.all([
        getAllDisputes(),
        API.get("/auth/users/role/mediator"),
      ]);
      setDisputes(disputeRes.data.data || []);
      setMediators(mediatorRes.data.data || []);
    } catch {
      setMessage("Failed to load disputes.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignMediator = async (disputeId) => {
    if (!mediatorMap[disputeId]) {
      setMessage("Please select a mediator.");
      return;
    }

    try {
      await assignMediatorToDispute(disputeId, {
        mediator_id: parseInt(mediatorMap[disputeId], 10),
      });
      setMessage("Mediator assigned successfully.");
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to assign mediator.");
    }
  };

  const handleResolve = async (disputeId) => {
    if (!resolutionMap[disputeId]) {
      setMessage("Please write a resolution first.");
      return;
    }

    try {
      await resolveDispute(disputeId, {
        resolution: resolutionMap[disputeId],
      });
      setMessage("Dispute resolved successfully.");
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to resolve dispute.");
    }
  };

  const badgeStyle = (status) => {
    if (status === "resolved") return { background: "#dcfce7", color: "#166534" };
    if (status === "under_review") return { background: "#dbeafe", color: "#1d4ed8" };
    return { background: "#fef3c7", color: "#92400e" };
  };

  return (
    <div style={UI.page}>
      <nav style={UI.navbar}>
        <div style={UI.brand}>🏠 PropManager Admin</div>
        <div style={UI.navActions}>
          <button onClick={() => navigate("/admin-dashboard")} style={BTN.secondary}>
            Dashboard
          </button>
          <button onClick={() => navigate("/notifications")} style={BTN.primary}>
            Notifications
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              navigate("/");
            }}
            style={BTN.danger}
          >
            Logout
          </button>
        </div>
      </nav>

      <div style={UI.container}>
        <div style={UI.hero}>
          <h1 style={UI.heroTitle}>Dispute Management</h1>
          <p style={UI.heroText}>Assign mediators and resolve disputes.</p>
        </div>

        {message && <div style={UI.message}>{message}</div>}

        {disputes.length === 0 ? (
          <div style={UI.emptyBox}>No disputes yet.</div>
        ) : (
          disputes.map((d) => (
            <div key={d.dispute_id} style={{ ...UI.card, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    Dispute #{d.dispute_id}
                  </div>
                  <div style={{ color: "#64748b", marginTop: 4 }}>
                    Request: {d.request_title}
                  </div>
                  <div style={{ color: "#64748b", marginTop: 4 }}>
                    By: {d.initiated_by_name}
                  </div>
                </div>

                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    fontWeight: 700,
                    ...badgeStyle(d.status),
                    height: "fit-content",
                  }}
                >
                  {d.status}
                </div>
              </div>

              <div style={{ marginTop: 12, color: "#334155" }}>
                {d.description}
              </div>

              <div style={{ marginTop: 14, color: "#64748b", fontSize: 14 }}>
                Mediator: {d.mediator_name || "Not assigned"}
              </div>

              {d.status !== "resolved" && (
                <div style={{ ...UI.grid3, marginTop: 16 }}>
                  <section style={UI.card}>
                    <h3 style={UI.sectionTitle}>Assign Mediator</h3>
                    <select
                      style={UI.input}
                      value={mediatorMap[d.dispute_id] || ""}
                      onChange={(e) =>
                        setMediatorMap({
                          ...mediatorMap,
                          [d.dispute_id]: e.target.value,
                        })
                      }
                    >
                      <option value="">Select mediator</option>
                      {mediators.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                    </select>

                    <button
                      style={{ ...BTN.success, width: "100%" }}
                      onClick={() => handleAssignMediator(d.dispute_id)}
                    >
                      Assign Mediator
                    </button>
                  </section>

                  <section style={{ ...UI.card, gridColumn: "span 2" }}>
                    <h3 style={UI.sectionTitle}>Resolve Dispute</h3>
                    <textarea
                      style={{ ...UI.input, minHeight: 110, resize: "vertical" }}
                      placeholder="Write resolution..."
                      value={resolutionMap[d.dispute_id] || ""}
                      onChange={(e) =>
                        setResolutionMap({
                          ...resolutionMap,
                          [d.dispute_id]: e.target.value,
                        })
                      }
                    />
                    <button style={BTN.primary} onClick={() => handleResolve(d.dispute_id)}>
                      Mark Resolved
                    </button>
                  </section>
                </div>
              )}

              {d.resolution && (
                <div style={{ marginTop: 14, ...UI.item }}>
                  <div style={UI.itemTitle}>Resolution</div>
                  <div style={UI.itemSub}>{d.resolution}</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}