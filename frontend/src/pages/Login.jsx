import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await API.post("/auth/login", form);
      const user = res.data.data;

      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "admin") {
  navigate("/admin-dashboard");
} else if (user.role === "landlord") {
  navigate("/landlord-dashboard");
} else if (user.role === "tenant") {
  navigate("/tenant-dashboard");
} else if (user.role === "mediator") {
  navigate("/mediator-dashboard");
} else {
  navigate("/");
}
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 52 }}>🏠</div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>PropManager</h1>
          <p style={{ color: "#6b7280", marginTop: 8 }}>Welcome back</p>
        </div>

        <h2 style={{ marginBottom: 8 }}>Sign In</h2>
        <p style={{ color: "#6b7280", marginBottom: 24 }}>
          Log in to continue to your dashboard
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email Address</label>
          <input
            style={styles.input}
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            name="password"
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button type="submit" style={styles.button}>
            Sign In →
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, color: "#6b7280" }}>
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #5b6ee1, #8b5cf6)",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 560,
    background: "#fff",
    borderRadius: 18,
    padding: 40,
    boxShadow: "0 15px 40px rgba(0,0,0,0.12)",
  },
  label: {
    display: "block",
    marginBottom: 8,
    marginTop: 14,
    fontWeight: 600,
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    marginBottom: 8,
    fontSize: 15,
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    marginTop: 20,
    padding: "14px 16px",
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
  },
  error: {
    marginBottom: 16,
    padding: "12px 14px",
    borderRadius: 10,
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
};