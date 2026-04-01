export const UI = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    fontFamily: "Inter, sans-serif",
    color: "#0f172a",
  },

  navbar: {
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #e2e8f0",
    padding: "0 24px",
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 30,
  },

  brand: {
    fontWeight: 800,
    fontSize: 22,
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  navActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  container: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "22px 18px 36px",
  },

  hero: {
    background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
    color: "#fff",
    borderRadius: 22,
    padding: "24px 24px",
    marginBottom: 18,
    boxShadow: "0 14px 30px rgba(37,99,235,0.18)",
  },

  heroTitle: {
    margin: 0,
    fontSize: 34,
    fontWeight: 800,
    lineHeight: 1.1,
  },

  heroText: {
    marginTop: 8,
    marginBottom: 0,
    fontSize: 14,
    opacity: 0.95,
  },

  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: 14,
  },

  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 14,
  },

  statCard: {
    background: "#fff",
    borderRadius: 18,
    padding: "18px 18px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
  },

  statValue: {
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 6,
  },

  statLabel: {
    color: "#64748b",
    fontSize: 14,
  },

  card: {
    background: "#fff",
    borderRadius: 18,
    padding: 18,
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
  },

  cardTitle: {
    marginTop: 0,
    marginBottom: 12,
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 800,
    marginTop: 0,
    marginBottom: 12,
  },

  item: {
    padding: "12px 14px",
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },

  itemTitle: {
    fontWeight: 700,
    fontSize: 15,
    color: "#0f172a",
  },

  itemSub: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.5,
  },

  input: {
    width: "100%",
    padding: "11px 13px",
    marginBottom: 10,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
    fontSize: 14,
    background: "#fff",
    outline: "none",
  },

  infoBox: {
    background: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
  },

  infoRow: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 1.8,
  },

  message: {
    marginBottom: 14,
    padding: "12px 14px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 14,
    color: "#166534",
    fontWeight: 500,
  },

  error: {
    marginBottom: 14,
    padding: "12px 14px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 14,
    color: "#b91c1c",
    fontWeight: 500,
  },

  emptyBox: {
    background: "#fff",
    borderRadius: 18,
    padding: 40,
    textAlign: "center",
    border: "1px solid #e2e8f0",
    color: "#64748b",
  },
};

export const BTN = {
  primary: {
    padding: "10px 16px",
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(37,99,235,0.18)",
  },

  secondary: {
    padding: "10px 16px",
    border: "1px solid #dbe3ef",
    borderRadius: 12,
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 700,
    cursor: "pointer",
  },

  success: {
    padding: "10px 16px",
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(34,197,94,0.18)",
  },

  warning: {
    padding: "10px 16px",
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

  danger: {
    padding: "10px 16px",
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(135deg, #ef4444, #f87171)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(239,68,68,0.18)",
  },

  linkPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 16px",
    borderRadius: 12,
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
    boxShadow: "0 8px 18px rgba(37,99,235,0.18)",
  },

  linkPurple: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 16px",
    borderRadius: 12,
    background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
    boxShadow: "0 8px 18px rgba(124,58,237,0.18)",
  },

  linkGreen: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 16px",
    borderRadius: 12,
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
    boxShadow: "0 8px 18px rgba(34,197,94,0.18)",
  },
};