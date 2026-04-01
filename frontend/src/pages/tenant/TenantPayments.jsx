import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTenantPayments, recordPayment } from "../../api/paymentAPI";
import { UI, BTN } from "../../styles/ui";

export default function TenantPayments() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState("");
  const [payForm, setPayForm] = useState({
    payment_id: "",
    amount_paid: "",
    payment_method: "",
    reference_note: "",
    paid_date: "",
  });

  const loadPayments = async () => {
    try {
      const res = await getTenantPayments(user.id);
      setPayments(res.data.data || []);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to load payment history.");
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadPayments();
    }
  }, [user?.id]);

  const handlePay = async () => {
    try {
      await recordPayment({
        payment_id: parseInt(payForm.payment_id, 10),
        amount_paid: parseFloat(payForm.amount_paid),
        payment_method: payForm.payment_method,
        reference_note: payForm.reference_note,
        paid_date: payForm.paid_date,
      });

      setMessage("Payment recorded successfully.");
      setPayForm({
        payment_id: "",
        amount_paid: "",
        payment_method: "",
        reference_note: "",
        paid_date: "",
      });
      loadPayments();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to record payment.");
    }
  };

  const statusStyle = (status) => {
    if (status === "paid") return { color: "#166534", bg: "#dcfce7" };
    if (status === "late") return { color: "#991b1b", bg: "#fee2e2" };
    if (status === "partial") return { color: "#92400e", bg: "#fef3c7" };
    return { color: "#1d4ed8", bg: "#dbeafe" };
  };

  return (
    <div style={UI.page}>
      <nav style={UI.navbar}>
        <div style={UI.brand}>🏠 PropManager</div>
        <div style={UI.navActions}>
          <button onClick={() => navigate("/tenant-dashboard")} style={BTN.secondary}>
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
        <div style={UI.hero}>
          <h1 style={UI.heroTitle}>Rent & Payments</h1>
          <p style={UI.heroText}>View payment history and record rent payments.</p>
        </div>

        {message && <div style={UI.message}>{message}</div>}

        <div style={{ ...UI.grid3, marginBottom: 18 }}>
          <section style={UI.card}>
            <h3 style={UI.sectionTitle}>Record Payment</h3>

            <select
              style={UI.input}
              value={payForm.payment_id}
              onChange={(e) => setPayForm({ ...payForm, payment_id: e.target.value })}
            >
              <option value="">Select payment record</option>
              {payments
                .filter((p) => p.status !== "paid")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.payment_month} {p.payment_year} — Due {p.amount_due}
                  </option>
                ))}
            </select>

            <input
              style={UI.input}
              type="number"
              placeholder="Amount paid"
              value={payForm.amount_paid}
              onChange={(e) => setPayForm({ ...payForm, amount_paid: e.target.value })}
            />

            <input
              style={UI.input}
              placeholder="Payment method"
              value={payForm.payment_method}
              onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
            />

            <input
              style={UI.input}
              placeholder="Reference / note"
              value={payForm.reference_note}
              onChange={(e) => setPayForm({ ...payForm, reference_note: e.target.value })}
            />

            <input
              style={UI.input}
              type="date"
              value={payForm.paid_date}
              onChange={(e) => setPayForm({ ...payForm, paid_date: e.target.value })}
            />

            <button style={{ ...BTN.success, width: "100%" }} onClick={handlePay}>
              Record Payment
            </button>
          </section>

          <section style={{ ...UI.card, gridColumn: "span 2" }}>
            <h3 style={UI.sectionTitle}>Payment History</h3>

            {payments.length === 0 ? (
              <div style={UI.emptyBox}>No payment records yet.</div>
            ) : (
              payments.map((p) => {
                const s = statusStyle(p.status);
                return (
                  <div key={p.id} style={{ ...UI.item, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div>
                        <div style={UI.itemTitle}>
                          {p.payment_month} {p.payment_year}
                        </div>
                        <div style={UI.itemSub}>Property: {p.property_address}</div>
                        <div style={UI.itemSub}>
                          Due: {p.amount_due} | Paid: {p.amount_paid}
                        </div>
                        <div style={UI.itemSub}>
                          Due date: {p.due_date} {p.paid_date ? `| Paid date: ${p.paid_date}` : ""}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "6px 12px",
                          borderRadius: 999,
                          background: s.bg,
                          color: s.color,
                          fontWeight: 700,
                          height: "fit-content",
                        }}
                      >
                        {p.status}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>
      </div>
    </div>
  );
}