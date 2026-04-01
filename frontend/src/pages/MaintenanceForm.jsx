import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { uploadEvidence } from "../api/evidenceAPI";
import { UI, BTN } from "../styles/ui";

export default function MaintenanceForm() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    priority: "medium",
  });

  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    "plumbing",
    "electrical",
    "appliances",
    "cleaning",
    "heating",
    "painting",
    "other",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.title || !form.description) {
      setMessage("Title and description are required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await API.post("/maintenance/", {
        tenant_id: user.id,
        title: form.title,
        category: form.category,
        description: form.description,
        priority: form.priority,
      });

      const requestId = res.data?.data?.request_id;

      if (requestId && files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("uploaded_by", user.id);
          formData.append("request_id", requestId);
          formData.append("document_category", "maintenance_evidence");
          await uploadEvidence(formData);
        }
      }

      setMessage("Maintenance request submitted successfully.");
      setTimeout(() => navigate("/maintenance"), 900);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={UI.page}>
      <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
        <button
  onClick={() => navigate("/tenant-dashboard")}
  style={{
    background: "none",
    border: "none",
    color: "#4f46e5",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: "10px"
  }}
>
  ← Back to Dashboard
</button>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 38, fontWeight: 900, margin: 0, color: "#0f172a" }}>
            New Maintenance Request
          </h1>
          <p style={{ color: "#64748b", marginTop: 8 }}>
            Describe the issue and attach supporting evidence if needed.
          </p>
        </div>

        {message && <div style={UI.message}>{message}</div>}

        <form onSubmit={handleSubmit} style={UI.card}>
          <label style={labelStyle}>Issue Title *</label>
          <input
            style={UI.input}
            type="text"
            placeholder="e.g. Leaking kitchen faucet"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <label style={labelStyle}>Category</label>
          <select
            style={UI.input}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">Select a category...</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>

          <label style={labelStyle}>Description *</label>
          <textarea
            style={{ ...UI.input, minHeight: 120, resize: "vertical" }}
            placeholder="Describe the issue in detail..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <label style={labelStyle}>Priority *</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
            {[
              { value: "low", label: "🟢 Low", sub: "Minor issue, not urgent" },
              { value: "medium", label: "🟡 Medium", sub: "Needs attention soon" },
              { value: "high", label: "🔴 High", sub: "Urgent — affects daily life" },
            ].map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setForm({ ...form, priority: p.value })}
                style={{
                  padding: "14px 12px",
                  borderRadius: 12,
                  border:
                    form.priority === p.value
                      ? "2px solid #6366f1"
                      : "1px solid #cbd5e1",
                  background: form.priority === p.value ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div style={{ fontWeight: 800, color: "#0f172a" }}>{p.label}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{p.sub}</div>
              </button>
            ))}
          </div>

          <label style={labelStyle}>Upload Evidence (optional)</label>
          <div
            style={{
              border: "1px solid #dbe3ef",
              borderRadius: 14,
              padding: 14,
              background: "#f8fafc",
              marginBottom: 18,
            }}
          >
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>
              Upload photos, PDFs, or other documents related to the issue.
            </div>

            {files.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      marginBottom: 8,
                      fontSize: 14,
                      color: "#334155",
                    }}
                  >
                    {file.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...BTN.primary,
              width: "100%",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Submitting..." : "Submit Request →"}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 8,
  marginTop: 6,
  fontWeight: 700,
  color: "#334155",
};