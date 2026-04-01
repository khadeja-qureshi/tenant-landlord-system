import { useEffect, useState } from "react";
import {
  getAllProviders, assignProvider,
  getAssignmentByRequest, updateAssignmentStatus, reassignProvider
} from "../api/providerAPI";

export default function AssignProviderModal({ requestId, landlordId, onClose, onRefresh }) {
  const [providers,        setProviders]        = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [notes,            setNotes]            = useState("");
  const [assignment,       setAssignment]       = useState(null);
  const [message,          setMessage]          = useState("");
  const [loading,          setLoading]          = useState(false);

  useEffect(() => {
    loadProviders();
    loadAssignment();
  }, []);

  const loadProviders = async () => {
    try {
      const res = await getAllProviders();
      setProviders(res.data.data || []);
    } catch { setMessage("Could not load providers."); }
  };

  const loadAssignment = async () => {
    try {
      const res = await getAssignmentByRequest(requestId);
      const list = res.data.data || [];
      const active = list.find(a => !["cancelled","completed"].includes(a.assignment_status));
      setAssignment(active || null);
    } catch {}
  };

  const handleAssign = async () => {
    if (!selectedProvider) return setMessage("Please select a provider.");
    setLoading(true);
    try {
      await assignProvider({
        request_id:  requestId,
        provider_id: parseInt(selectedProvider),
        assigned_by: landlordId,
        notes
      });
      setMessage("✅ Provider assigned!");
      setSelectedProvider(""); setNotes("");
      loadAssignment();
      onRefresh();
    } catch (err) {
      setMessage(err.response?.data?.error || "Assignment failed.");
    } finally { setLoading(false); }
  };

  const handleReassign = async () => {
    if (!selectedProvider) return setMessage("Please select a new provider.");
    setLoading(true);
    try {
      await reassignProvider(assignment.assignment_id, {
        provider_id: parseInt(selectedProvider),
        assigned_by: landlordId,
        notes
      });
      setMessage("✅ Provider reassigned!");
      setSelectedProvider(""); setNotes("");
      loadAssignment();
      onRefresh();
    } catch (err) {
      setMessage(err.response?.data?.error || "Reassignment failed.");
    } finally { setLoading(false); }
  };

  const handleStatus = async (newStatus) => {
    setLoading(true);
    try {
      await updateAssignmentStatus(assignment.assignment_id, {
        status: newStatus, user_id: landlordId
      });
      setMessage(`✅ Marked as ${newStatus}`);
      loadAssignment();
      onRefresh();
    } catch (err) {
      setMessage(err.response?.data?.error || "Update failed.");
    } finally { setLoading(false); }
  };

  return (
    <div style={S.overlay}>
      <div style={S.modal}>

        {/* HEADER */}
        <div style={S.modalHeader}>
          <h3 style={{ margin: 0 }}>🔧 Assign Service Provider</h3>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>
        <p style={{ color: "#6b7280", marginTop: 4 }}>Request #{requestId}</p>

        {message && <div style={S.msg}>{message}</div>}

        {/* CURRENT ASSIGNMENT */}
        {assignment && (
          <div style={S.assignBox}>
            <p style={S.assignTitle}>📋 Current Assignment</p>
            <div style={S.grid2}>
              <div><b>Provider</b><p>{assignment.provider_name}</p></div>
              <div><b>Service</b><p>{assignment.service_type}</p></div>
              <div><b>Contact</b><p>{assignment.provider_contact || "—"}</p></div>
              <div><b>Assigned by</b><p>{assignment.assigned_by_name}</p></div>
            </div>
            {assignment.notes && <p><b>Notes:</b> {assignment.notes}</p>}
            <div style={{ marginTop: 8 }}>
              <b>Status: </b>
              <span style={badge(assignment.assignment_status)}>
                {assignment.assignment_status.replace("_"," ")}
              </span>
            </div>

            {/* STATUS ACTION BUTTONS */}
            <div style={S.btnRow}>
              {assignment.assignment_status === "assigned" && (
                <button style={S.btnBlue} onClick={() => handleStatus("in_progress")} disabled={loading}>
                  ▶ Mark In Progress
                </button>
              )}
              {assignment.assignment_status === "in_progress" && (
                <button style={S.btnGreen} onClick={() => handleStatus("completed")} disabled={loading}>
                  ✓ Mark Completed
                </button>
              )}
              {["assigned","in_progress"].includes(assignment.assignment_status) && (
                <button style={S.btnOrange} onClick={() => handleStatus("cancelled")} disabled={loading}>
                  ✕ Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {/* ASSIGN / REASSIGN FORM */}
        <div style={{ marginTop: 16 }}>
          <label style={S.label}>
            {assignment ? "Select New Provider" : "Select Provider"}
          </label>
          <select
            value={selectedProvider}
            onChange={e => setSelectedProvider(e.target.value)}
            style={S.select}
          >
            <option value="">-- Choose a provider --</option>
            {providers.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.service_type}
              </option>
            ))}
          </select>

          <label style={S.label}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any instructions for the provider..."
            style={S.textarea}
          />

          <div style={S.btnRow}>
            {!assignment ? (
              <button style={S.btnGreen} onClick={handleAssign} disabled={loading}>
                {loading ? "Assigning..." : "✓ Assign Provider"}
              </button>
            ) : (
              <button style={S.btnBlue} onClick={handleReassign} disabled={loading}>
                {loading ? "Reassigning..." : "↺ Reassign Provider"}
              </button>
            )}
            <button style={S.btnGrey} onClick={onClose}>Close</button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── badge color by status ──
const badge = (s) => ({
  display: "inline-block",
  padding: "2px 10px", borderRadius: 10,
  fontSize: 12, fontWeight: 600, marginLeft: 6,
  background: s==="completed"   ? "#dcfce7"
            : s==="in_progress" ? "#dbeafe"
            : s==="cancelled"   ? "#fee2e2" : "#fef9c3",
  color:      s==="completed"   ? "#166534"
            : s==="in_progress" ? "#1d4ed8"
            : s==="cancelled"   ? "#991b1b" : "#854d0e",
});

// ── styles ──
const S = {
  overlay:     { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 },
  modal:       { background:"#fff", borderRadius:12, padding:28, width:"100%", maxWidth:500, boxShadow:"0 8px 30px rgba(0,0,0,0.15)", maxHeight:"90vh", overflowY:"auto" },
  modalHeader: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  closeBtn:    { background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#6b7280" },
  assignBox:   { background:"#f0f7ff", borderRadius:8, padding:16, marginTop:12, fontSize:14 },
  assignTitle: { fontWeight:700, marginBottom:8, color:"#1d4ed8" },
  grid2:       { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 },
  msg:         { padding:"10px 14px", background:"#f0fdf4", borderRadius:6, fontSize:13, marginBottom:10, border:"1px solid #bbf7d0" },
  label:       { display:"block", fontSize:13, fontWeight:600, marginBottom:4, marginTop:12 },
  select:      { width:"100%", padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:14 },
  textarea:    { width:"100%", padding:9, borderRadius:6, border:"1px solid #d1d5db", fontSize:14, minHeight:70, resize:"vertical", boxSizing:"border-box" },
  btnRow:      { display:"flex", gap:8, marginTop:14, flexWrap:"wrap" },
  btnGreen:    { padding:"9px 18px", background:"#16a34a", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 },
  btnBlue:     { padding:"9px 18px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 },
  btnOrange:   { padding:"9px 18px", background:"#f97316", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 },
  btnGrey:     { padding:"9px 18px", background:"#9ca3af", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 },
};