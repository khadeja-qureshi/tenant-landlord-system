import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLandlordDisputes } from "../../api/disputeAPI";
import { getDisputeEvidence } from "../../api/evidenceAPI";
import DocumentManager from "../../components/DocumentManager";
import { UI, BTN } from "../../styles/ui";

export default function LandlordDisputes() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [disputes, setDisputes] = useState([]);
  const [evidenceMap, setEvidenceMap] = useState({});
  const [message, setMessage] = useState("");

  const loadDisputes = async () => {
    try {
      const res = await getLandlordDisputes(user.id);
      setDisputes(res.data.data || []);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to load disputes.");
    }
  };

  const loadEvidence = async (disputeId) => {
    try {
      const res = await getDisputeEvidence(disputeId);
      setEvidenceMap((prev) => ({ ...prev, [disputeId]: res.data.data || [] }));
    } catch {
      setEvidenceMap((prev) => ({ ...prev, [disputeId]: [] }));
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadDisputes();
    }
  }, [user?.id]);

  useEffect(() => {
    if (disputes.length) {
      disputes.forEach((d) => {
        if (!evidenceMap[d.dispute_id]) {
          loadEvidence(d.dispute_id);
        }
      });
    }
  }, [disputes]);

  return (
    <div style={UI.page}>
      <nav style={UI.navbar}>
        <div style={UI.brand}>🏠 PropManager</div>
        <div style={UI.navActions}>
          <button onClick={() => navigate("/landlord-dashboard")} style={BTN.secondary}>
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
          <h1 style={UI.heroTitle}>Disputes</h1>
          <p style={UI.heroText}>Review tenant disputes and upload response evidence.</p>
        </div>

        {message && <div style={UI.message}>{message}</div>}

        {disputes.length === 0 ? (
          <div style={UI.emptyBox}>No disputes found.</div>
        ) : (
          disputes.map((d) => (
            <div key={d.dispute_id} style={{ ...UI.card, marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>
                Dispute #{d.dispute_id} — {d.request_title}
              </div>

              <div style={{ marginTop: 8, color: "#475569" }}>{d.description}</div>

              <div style={{ marginTop: 10, color: "#64748b", fontSize: 14 }}>
                Tenant: {d.initiated_by_name} ({d.initiated_by_email})
              </div>

              <div style={{ marginTop: 6, color: "#64748b", fontSize: 14 }}>
                Mediator: {d.mediator_name || "Not assigned"}
              </div>

              <div style={{ marginTop: 6, color: "#64748b", fontSize: 14 }}>
                Status: {d.status}
              </div>

              <div style={{ marginTop: 14 }}>
                <DocumentManager
                  user={user}
                  title={`Dispute Evidence ${d.dispute_id}`}
                  documents={evidenceMap[d.dispute_id] || []}
                  refreshDocuments={() => loadEvidence(d.dispute_id)}
                  disputeId={d.dispute_id}
                  defaultCategory="dispute_evidence"
                  allowUpload={true}
                  allowEdit={true}
                  allowDelete={true}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}