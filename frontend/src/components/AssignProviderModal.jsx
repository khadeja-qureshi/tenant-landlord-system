import { useEffect, useState } from "react";
import {
  getRequestAssignments,
  assignProviderToRequest,
  updateAssignmentStatus,
} from "../api/assignmentAPI";
import { getProviders } from "../api/providerAPI";

export default function AssignProviderModal({
  isOpen,
  onClose,
  requestItem,
  user,
  onAssigned,
}) {
  const [providers, setProviders] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [providerId, setProviderId] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  const loadProviders = async () => {
    try {
      const res = await getProviders();
      setProviders(res.data.data || []);
    } catch {
      setProviders([]);
    }
  };

  const loadAssignments = async () => {
    if (!requestItem?.id) return;
    try {
      const res = await getRequestAssignments(requestItem.id);
      setAssignments(res.data.data || []);
    } catch {
      setAssignments([]);
    }
  };

  useEffect(() => {
    if (isOpen && requestItem?.id) {
      loadProviders();
      loadAssignments();
      setProviderId("");
      setNotes("");
      setMessage("");
    }
  }, [isOpen, requestItem?.id]);

  const handleAssign = async () => {
    if (!providerId) {
      setMessage("Please choose a provider.");
      return;
    }

    try {
      await assignProviderToRequest({
        request_id: requestItem.id,
        provider_id: parseInt(providerId, 10),
        assigned_by: user.id,
        notes,
      });

      setMessage("Provider assigned successfully.");
      setProviderId("");
      setNotes("");
      await loadAssignments();
      if (onAssigned) onAssigned();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to assign provider.");
    }
  };

  const handleMarkInProgress = async (assignmentId) => {
    try {
      await updateAssignmentStatus(assignmentId, {
        status: "in_progress",
        notes: "Work started",
      });
      setMessage("Assignment marked in progress.");
      await loadAssignments();
      if (onAssigned) onAssigned();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update assignment.");
    }
  };

  if (!isOpen || !requestItem) return null;

  const currentAssignment = assignments[0] || null;

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.header}>
          <div>
            <h3 style={S.title}>Assign Service Provider</h3>
            <div style={S.subTitle}>Request #{requestItem.id}</div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {message && <div style={S.successBox}>{message}</div>}

        {currentAssignment && (
          <div style={S.currentBox}>
            <div style={S.currentHeading}>📋 Current Assignment</div>

            <div style={S.infoGrid}>
              <div>
                <div style={S.label}>Provider</div>
                <div style={S.value}>{currentAssignment.provider_name}</div>
              </div>
              <div>
                <div style={S.label}>Service</div>
                <div style={S.value}>{currentAssignment.service_type}</div>
              </div>
              <div>
                <div style={S.label}>Contact</div>
                <div style={S.value}>{currentAssignment.contact_info || "—"}</div>
              </div>
              <div>
                <div style={S.label}>Assigned by</div>
                <div style={S.value}>{currentAssignment.assigned_by_name}</div>
              </div>
            </div>

            {currentAssignment.notes && (
              <div style={{ marginTop: 10 }}>
                <div style={S.label}>Notes</div>
                <div style={S.value}>{currentAssignment.notes}</div>
              </div>
            )}

            <div style={{ marginTop: 10 }}>
              <div style={S.label}>Status</div>
              <span style={S.badge}>{currentAssignment.status}</span>
            </div>

            <div style={S.actionRow}>
              <button
                style={S.blueBtn}
                onClick={() => handleMarkInProgress(currentAssignment.id)}
              >
                Mark In Progress
              </button>
              <button style={S.orangeBtn} onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <label style={S.fieldLabel}>Select New Provider</label>
          <select
            style={S.input}
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
          >
            <option value="">-- Choose a provider --</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.service_type}
              </option>
            ))}
          </select>

          <label style={S.fieldLabel}>Notes (optional)</label>
          <textarea
            style={S.textarea}
            placeholder="Any instructions for the provider..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div style={S.footerRow}>
            <button style={S.blueBtn} onClick={handleAssign}>
              {currentAssignment ? "Reassign Provider" : "Assign Provider"}
            </button>
            <button style={S.grayBtn} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 560,
    background: "#fff",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    color: "#0f172a",
  },
  subTitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  closeBtn: {
    border: "none",
    background: "transparent",
    fontSize: 22,
    cursor: "pointer",
    color: "#94a3b8",
  },
  successBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    borderRadius: 12,
    padding: "10px 12px",
    marginBottom: 12,
  },
  currentBox: {
    background: "#f8fbff",
    border: "1px solid #dbeafe",
    borderRadius: 14,
    padding: 14,
  },
  currentHeading: {
    fontWeight: 800,
    color: "#1e3a8a",
    marginBottom: 12,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  label: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 3,
    fontWeight: 700,
  },
  value: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: 600,
  },
  badge: {
    display: "inline-block",
    marginTop: 4,
    background: "#fef3c7",
    color: "#92400e",
    fontWeight: 700,
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
  },
  actionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 14,
  },
  fieldLabel: {
    display: "block",
    marginTop: 12,
    marginBottom: 6,
    fontWeight: 700,
    color: "#334155",
    fontSize: 13,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 82,
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    resize: "vertical",
    boxSizing: "border-box",
  },
  footerRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 14,
  },
  blueBtn: {
    padding: "10px 16px",
    border: "none",
    borderRadius: 10,
    background: "#3b82f6",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  orangeBtn: {
    padding: "10px 16px",
    border: "none",
    borderRadius: 10,
    background: "#f59e0b",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  grayBtn: {
    padding: "10px 16px",
    border: "none",
    borderRadius: 10,
    background: "#94a3b8",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
};