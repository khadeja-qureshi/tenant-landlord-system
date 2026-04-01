import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { fileDispute } from "../../api/disputeAPI";
import { uploadEvidence } from "../../api/evidenceAPI";
import { UI, BTN } from "../../styles/ui";

export default function FileDispute() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    request_id: "",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const loadRequests = async () => {
    try {
      const res = await API.get(`/maintenance/tenant/${user.id}`);
      const reqs = res.data.data || [];
      setRequests(reqs);
    } catch {
      setRequests([]);
    }
  };

useEffect(() => {
  if (user?.id) {
    loadRequests();
  }
}, [user?.id]);

  const handleSubmit = async () => {
    if (!form.request_id || !form.description) {
      setMessage("Please select request and enter description.");
      return;
    }

    try {
      const disputeRes = await fileDispute({
        request_id: parseInt(form.request_id, 10),
        initiated_by: user.id,
        description: form.description,
      });

      const disputeId = disputeRes.data.data?.dispute_id;

      if (selectedFile && disputeId) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("uploaded_by", user.id);
        formData.append("dispute_id", disputeId);
        formData.append("document_category", "dispute_evidence");
        await uploadEvidence(formData);
      }

      setMessage("Dispute filed successfully.");
      setForm({ request_id: "", description: "" });
      setSelectedFile(null);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to file dispute.");
    }
  };

  return (
    <div style={UI.page}>
      <nav style={UI.navbar}>
        <div style={UI.brand}>🏠 PropManager</div>
        <div style={UI.navActions}>
          <button onClick={() => navigate("/tenant-dashboard")} style={BTN.secondary}>
            Dashboard
          </button>
          <button onClick={() => navigate("/tenant/disputes")} style={BTN.primary}>
            My Disputes
          </button>
          <button onClick={() => navigate("/notifications")} style={BTN.secondary}>
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
          <h1 style={UI.heroTitle}>File a Dispute</h1>
          <p style={UI.heroText}>Raise a dispute and optionally upload supporting evidence.</p>
        </div>

        {message && <div style={UI.message}>{message}</div>}

        <div style={{ maxWidth: 720 }}>
          <section style={UI.card}>
            <h3 style={UI.sectionTitle}>Dispute Details</h3>

            <select
              style={UI.input}
              value={form.request_id}
              onChange={(e) => setForm({ ...form, request_id: e.target.value })}
            >
              <option value="">Select maintenance request</option>
              {requests.map((r) => (
                <option key={r.id} value={r.id}>
                  #{r.id} — {r.title}
                </option>
              ))}
            </select>

            <textarea
              style={{ ...UI.input, minHeight: 130, resize: "vertical" }}
              placeholder="Describe the dispute..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                Upload supporting document (optional)
              </label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>

            <button style={BTN.primary} onClick={handleSubmit}>
              Submit Dispute
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}