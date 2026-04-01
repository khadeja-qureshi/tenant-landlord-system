import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMediatorDisputes, resolveDispute } from "../../api/disputeAPI";
import { UI, BTN } from "../../styles/ui";

export default function MediatorDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [disputes, setDisputes] = useState([]);
  const [message, setMessage] = useState("");
  const [resolutionMap, setResolutionMap] = useState({});

  const loadDisputes = async () => {
    try {
      const res = await getMediatorDisputes(user.id);
      setDisputes(res.data.data || []);
    } catch {
      setMessage("Failed to load mediator disputes.");
    }
  };

useEffect(() => {
  if (user?.id) {
    loadDisputes();
  }
}, [user?.id]);

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
      loadDisputes();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to resolve dispute.");
    }
  };

  return (
    <div style={UI.page}>
      <nav style={UI.navbar}>
        <div style={UI.brand}>🏠 PropManager Mediator</div>
        <div style={UI.navActions}>
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
          <h1 style={UI.heroTitle}>Mediator Dashboard</h1>
          <p style={UI.heroText}>View and resolve only the disputes assigned to you by admin.</p>
        </div>

        {message && <div style={UI.message}>{message}</div>}

        {disputes.length === 0 ? (
          <div style={UI.emptyBox}>No disputes assigned to you.</div>
        ) : (
          disputes.map((d) => (
            <div key={d.dispute_id} style={{ ...UI.card, marginBottom: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>
                Dispute #{d.dispute_id}
              </div>
              <div style={{ color: "#64748b", marginTop: 6 }}>
                Request: {d.request_title}
              </div>
              <div style={{ color: "#64748b", marginTop: 4 }}>
                Tenant: {d.initiated_by_name}
              </div>
              <div style={{ marginTop: 10, color: "#334155" }}>
                {d.description}
              </div>

              {d.status !== "resolved" ? (
                <div style={{ marginTop: 14 }}>
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
                  <button style={BTN.success} onClick={() => handleResolve(d.dispute_id)}>
                    Resolve Dispute
                  </button>
                </div>
              ) : (
                <div style={{ ...UI.item, marginTop: 14 }}>
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