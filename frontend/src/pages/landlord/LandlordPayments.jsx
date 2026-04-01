import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getLandlordPayments,
  generatePaymentRecord,
  updatePaymentStatus,
} from "../../api/paymentAPI";
import API from "../../api/axios";
import { UI, BTN } from "../../styles/ui";

export default function LandlordPayments() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [tenancies, setTenancies] = useState([]);
  const [message, setMessage] = useState("");

  const [genForm, setGenForm] = useState({
    tenancy_id: "",
    payment_month: "",
    payment_year: new Date().getFullYear(),
    due_date: "",
  });

  const loadPayments = async () => {
    try {
      const res = await getLandlordPayments(user.id);
      setPayments(res.data.data || []);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to load landlord payments.");
    }
  };

  const loadTenancies = async () => {
    try {
      const res = await API.get(`/tenancy/landlord/${user.id}`);
      setTenancies(res.data.data || []);
    } catch {
      setTenancies([]);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadPayments();
      loadTenancies();
    }
  }, [user?.id]);

  const handleGenerate = async () => {
    try {
      await generatePaymentRecord({
        tenancy_id: parseInt(genForm.tenancy_id, 10),
        payment_month: genForm.payment_month,
        payment_year: parseInt(genForm.payment_year, 10),
        due_date: genForm.due_date,
      });

      setMessage("Payment record generated successfully.");
      setGenForm({
        tenancy_id: "",
        payment_month: "",
        payment_year: new Date().getFullYear(),
        due_date: "",
      });
      loadPayments();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to generate payment record.");
    }
  };

  const handleStatusUpdate = async (paymentId, status) => {
    try {
      await updatePaymentStatus(paymentId, { status });
      setMessage("Payment status updated.");
      loadPayments();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update payment status.");
    }
  };

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
          <button onClick={() => {
            localStorage.removeItem("user");
            navigate("/");
          }} style={BTN.danger}>
            Logout
          </button>
        </div>
      </nav>

      <div style={UI.container}>
        <div style={{ ...UI.hero, background: "linear-gradient(135deg, #0f766e, #2563eb)" }}>
          <h1 style={UI.heroTitle}>Rent & Payment Tracking</h1>
          <p style={UI.heroText}>
            Generate rent records, review payment history, and manage statuses.
          </p>
        </div>

        {message && <div style={UI.message}>{message}</div>}

        <div style={{ ...UI.grid3, marginBottom: 18 }}>
          <section style={UI.card}>
            <h3 style={UI.sectionTitle}>Generate Monthly Rent Record</h3>

            <select
              style={UI.input}
              value={genForm.tenancy_id}
              onChange={(e) => setGenForm({ ...genForm, tenancy_id: e.target.value })}
            >
              <option value="">Select tenancy</option>
              {tenancies.map((t) => (
                <option key={t.tenancy_id} value={t.tenancy_id}>
                  {t.tenant_name} — {t.property_address}
                </option>
              ))}
            </select>

            <input
              style={UI.input}
              placeholder="Month (e.g. March)"
              value={genForm.payment_month}
              onChange={(e) => setGenForm({ ...genForm, payment_month: e.target.value })}
            />

            <input
              style={UI.input}
              type="number"
              placeholder="Year"
              value={genForm.payment_year}
              onChange={(e) => setGenForm({ ...genForm, payment_year: e.target.value })}
            />

            <input
              style={UI.input}
              type="date"
              value={genForm.due_date}
              onChange={(e) => setGenForm({ ...genForm, due_date: e.target.value })}
            />

            <button style={{ ...BTN.success, width: "100%" }} onClick={handleGenerate}>
              Generate Payment Record
            </button>
          </section>

          <section style={{ ...UI.card, gridColumn: "span 2" }}>
            <h3 style={UI.sectionTitle}>All Tenant Payments</h3>

            {payments.length === 0 ? (
              <div style={UI.emptyBox}>No rent records yet.</div>
            ) : (
              payments.map((p) => (
                <div key={p.id} style={{ ...UI.item, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={UI.itemTitle}>
                        {p.tenant_name} — {p.payment_month} {p.payment_year}
                      </div>
                      <div style={UI.itemSub}>Property: {p.property_address}</div>
                      <div style={UI.itemSub}>
                        Due: {p.amount_due} | Paid: {p.amount_paid}
                      </div>
                      <div style={UI.itemSub}>Status: {p.status}</div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button style={BTN.secondary} onClick={() => handleStatusUpdate(p.id, "pending")}>
                        Pending
                      </button>
                      <button style={BTN.warning} onClick={() => handleStatusUpdate(p.id, "partial")}>
                        Partial
                      </button>
                      <button style={BTN.success} onClick={() => handleStatusUpdate(p.id, "paid")}>
                        Paid
                      </button>
                      <button style={BTN.danger} onClick={() => handleStatusUpdate(p.id, "late")}>
                        Late
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}