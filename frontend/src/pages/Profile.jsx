import { useNavigate } from "react-router-dom";

export default function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "40px 20px"
    }}>

      {/* PROFILE CARD */}
      <div style={{
        background: "#fff",
        width: "100%",
        maxWidth: "520px",
        borderRadius: "16px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
        overflow: "hidden"
      }}>

        {/* HEADER */}
        <div style={{
          background: "linear-gradient(135deg,#0891b2,#06b6d4)",
          color: "#fff",
          padding: "28px",
          textAlign: "center"
        }}>
          <div style={{
            fontSize: 50,
            marginBottom: 10
          }}>
            👤
          </div>

          <h2 style={{ margin: 0 }}>
            {user?.name}
          </h2>

          <p style={{ opacity: 0.9, marginTop: 5 }}>
            Tenant Account
          </p>
        </div>

        {/* BODY */}
        <div style={{ padding: "30px" }}>

          <ProfileRow label="Name" value={user?.name} />
          <ProfileRow label="Email" value={user?.email} />
          <ProfileRow label="Role" value={user?.role} />

          {/* BUTTON */}
          <button
            onClick={() => navigate(-1)}
            style={{
              marginTop: 25,
              width: "100%",
              padding: "12px",
              background: "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              cursor: "pointer"
            }}
          >
            ← Back to Dashboard
          </button>

        </div>
      </div>
    </div>
  );
}

/* ✅ Reusable Row Component */
function ProfileRow({ label, value }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "14px 0",
      borderBottom: "1px solid #e5e7eb"
    }}>
      <span style={{
        color: "#6b7280",
        fontWeight: 500
      }}>
        {label}
      </span>

      <span style={{
        fontWeight: 600,
        color: "#111827"
      }}>
        {value || "-"}
      </span>
    </div>
  );
}