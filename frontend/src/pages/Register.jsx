import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function Register() {
  const navigate = useNavigate();

  // ✅ single state — no more formData vs form conflict
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", phone: "", role: "tenant"
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const setRole = (role) =>
    setFormData({ ...formData, role });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/auth/register", formData);
      setMessage({ text: "Account created! Redirecting to login…", type: "success" });
      setTimeout(() => navigate("/"), 1200);
    } catch (error) {
      setMessage({
        text: error.response?.data?.error || "Registration failed.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { role: "tenant",   label: "🏠 Tenant",   desc: "Report maintenance issues" },
    { role: "landlord", label: "🔑 Landlord",  desc: "Manage properties"         },
    { role: "mediator", label: "⚖️ Mediator",  desc: "Resolve disputes"          },
  ];

  return (
    <div style={page}>
      <div style={card}>

        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "42px" }}>🏠</div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: "6px 0 2px" }}>
            PropManager
          </h1>
        </div>

        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
          Create Account
        </h2>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "22px" }}>
          Join as a tenant, landlord or mediator
        </p>

        <form onSubmit={handleSubmit}>

          {/* NAME */}
          <Field label="Full Name">
            <input
              name="name" type="text" placeholder="John Doe"
              value={formData.name} onChange={handleChange}
              required style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#6366f1"}
              onBlur={e  => e.target.style.borderColor = "#e5e7eb"}
            />
          </Field>

          {/* EMAIL */}
          <Field label="Email Address">
            <input
              name="email" type="email" placeholder="you@example.com"
              value={formData.email} onChange={handleChange}
              required style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#6366f1"}
              onBlur={e  => e.target.style.borderColor = "#e5e7eb"}
            />
          </Field>

          {/* PASSWORD */}
          <Field label="Password">
            <input
              name="password" type="password" placeholder="••••••••"
              value={formData.password} onChange={handleChange}
              required style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#6366f1"}
              onBlur={e  => e.target.style.borderColor = "#e5e7eb"}
            />
          </Field>

          {/* PHONE */}
          <Field label="Phone (optional)">
            <input
              name="phone" type="text" placeholder="+92 300 0000000"
              value={formData.phone} onChange={handleChange}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#6366f1"}
              onBlur={e  => e.target.style.borderColor = "#e5e7eb"}
            />
          </Field>

          {/* ROLE SELECTOR */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
              I am a...
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {roles.map(r => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => setRole(r.role)}
                  style={{
                    padding: "12px 8px",
                    borderRadius: 12,
                    border: formData.role === r.role
                      ? "2px solid #6366f1"
                      : "1.5px solid #e5e7eb",
                    background: formData.role === r.role ? "#eef2ff" : "#fff",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 13,
                    color: formData.role === r.role ? "#4f46e5" : "#374151",
                    textAlign: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <div>{r.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 400, color: "#6b7280", marginTop: 4 }}>
                    {r.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* MESSAGE */}
          {message.text && (
            <div style={{
              background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
              color: message.type === "success" ? "#16a34a" : "#dc2626",
              padding: "10px 14px", borderRadius: 8,
              fontSize: 13, marginBottom: 14
            }}>
              {message.text}
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: 13,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 15, fontWeight: 600, cursor: "pointer",
              marginTop: 4,
            }}
          >
            {loading ? "Creating account…" : "Create Account →"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 14, color: "#6b7280", marginTop: 20 }}>
          Already have an account?{" "}
          <Link to="/" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const page = {
  minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  padding: 20, fontFamily: "'Inter', system-ui, sans-serif",
};
const card = {
  background: "#fff", borderRadius: 20, padding: 40,
  width: "100%", maxWidth: 440,
  boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
};
const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1.5px solid #e5e7eb", fontSize: 14,
  outline: "none", boxSizing: "border-box",
};
