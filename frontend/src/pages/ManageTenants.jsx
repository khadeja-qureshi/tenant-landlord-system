import { useEffect, useState } from "react";
import {
  getUnassignedTenants, getLandlordTenancies,
  getLandlordProperties, assignTenant, endTenancy
} from "../api/tenancyAPI";

export default function ManageTenants() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [unassigned,  setUnassigned]  = useState([]);
  const [tenancies,   setTenancies]   = useState([]);
  const [properties,  setProperties]  = useState([]);
  const [form,        setForm]        = useState({ tenant_id: "", property_id: "" });
  const [message,     setMessage]     = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [t, ten, p] = await Promise.all([
        getUnassignedTenants(),
        getLandlordTenancies(user.id),
        getLandlordProperties(user.id),
      ]);
      setUnassigned(t.data.data   || []);
      setTenancies(ten.data.data  || []);
      setProperties(p.data.data   || []);
    } catch (err) {
      setMessage("Failed to load data.");
    }
  };

  const handleAssign = async () => {
    if (!form.tenant_id || !form.property_id)
      return setMessage("Please select both a tenant and a property.");
    try {
      await assignTenant({
        tenant_id:   parseInt(form.tenant_id),
        property_id: parseInt(form.property_id),
      });
      setMessage("✅ Tenant assigned successfully!");
      setForm({ tenant_id: "", property_id: "" });
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Assignment failed.");
    }
  };

  const handleEndTenancy = async (tenancyId, tenantName) => {
    if (!window.confirm(`End tenancy for ${tenantName}?`)) return;
    try {
      await endTenancy(tenancyId);
      setMessage("✅ Tenancy ended.");
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to end tenancy.");
    }
  };


  return (
    <div style={S.page}>
      <h2>👥 Manage Tenants</h2>

      {message && <div style={S.msg}>{message}</div>}

      {/* ── ASSIGN TENANT FORM ── */}
      <div style={S.formBox}>
        <h4 style={{ marginTop: 0 }}>➕ Assign Tenant to Property</h4>

        <div style={S.formGrid}>
          <div>
            <label style={S.label}>Select Tenant</label>
            <select
              value={form.tenant_id}
              onChange={e => setForm({ ...form, tenant_id: e.target.value })}
              style={S.select}
            >
              <option value="">-- Choose a tenant --</option>
              {unassigned.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
            {unassigned.length === 0 && (
              <small style={{ color: "#6b7280" }}>
                No unassigned tenants. Register a tenant first.
              </small>
            )}
          </div>

          <div>
            <label style={S.label}>Select Property</label>
            <select
              value={form.property_id}
              onChange={e => setForm({ ...form, property_id: e.target.value })}
              style={S.select}
            >
              <option value="">-- Choose a property --</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.address}
                </option>
              ))}
            </select>
            {properties.length === 0 && (
              <small style={{ color: "#6b7280" }}>
                No properties found. Add a property first.
              </small>
            )}
          </div>
        </div>

        <button onClick={handleAssign} style={S.btnGreen}>
          Assign Tenant
        </button>
      </div>

      {/* ── CURRENT TENANCIES ── */}
      <h3>Current Tenants</h3>
      {tenancies.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No tenants assigned yet.</p>
      ) : (
        <div style={S.tableWrapper}>
          <table style={S.table}>
            <thead>
              <tr style={S.thead}>
                <th style={S.th}>Tenant</th>
                <th style={S.th}>Email</th>
                <th style={S.th}>Property</th>
                <th style={S.th}>Start Date</th>
                <th style={S.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tenancies.map((t, i) => (
                <tr key={t.tenancy_id} style={i % 2 === 0 ? S.rowEven : S.rowOdd}>
                  <td style={S.td}>{t.tenant_name}</td>
                  <td style={S.td}>{t.tenant_email}</td>
                  <td style={S.td}>{t.property_address}</td>
                  <td style={S.td}>{t.start_date ? new Date(t.start_date).toLocaleDateString() : "—"}</td>
                  <td style={S.td}>
                    <button
                      onClick={() => handleEndTenancy(t.tenancy_id, t.tenant_name)}
                      style={S.btnRed}
                    >
                      End Tenancy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const S = {
  page:        { maxWidth: "860px", margin: "40px auto", fontFamily: "Inter, sans-serif", padding: "0 16px" },
  msg:         { padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, marginBottom: 16, fontSize: 13 },
  formBox:     { background: "#f9fafb", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 28 },
  formGrid:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
  label:       { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 },
  select:      { width: "100%", padding: "9px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 },
  tableWrapper:{ overflowX: "auto" },
  table:       { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  thead:       { background: "#f3f4f6" },
  th:          { padding: "12px 14px", textAlign: "left", fontWeight: 600, borderBottom: "2px solid #e5e7eb" },
  td:          { padding: "11px 14px", borderBottom: "1px solid #f3f4f6" },
  rowEven:     { background: "#fff" },
  rowOdd:      { background: "#fafafa" },
  btnGreen:    { padding: "9px 18px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  btnRed:      { padding: "5px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 },
};