import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTenantVerificationDocs } from "../../api/evidenceAPI";
import DocumentManager from "../../components/DocumentManager";
import { UI, BTN } from "../../styles/ui";

export default function TenantVerificationDocs() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [docs, setDocs] = useState([]);

  const loadDocs = async () => {
    try {
      const res = await getTenantVerificationDocs(user.id);
      setDocs(res.data.data || []);
    } catch {
      setDocs([]);
    }
  };

  useEffect(() => {
    if (user?.id) loadDocs();
  }, [user?.id]);

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
          <button
            onClick={() => {
              localStorage.removeItem("user");
              navigate("/");
            }}
            style={BTN.danger}
          >
            Logout
          </button>
        </div>
      </nav>

      <div style={UI.container}>
        <div style={UI.hero}>
          <h1 style={UI.heroTitle}>Verification Documents</h1>
          <p style={UI.heroText}>
            Upload your ID and personal documents for landlord/admin review.
          </p>
        </div>

        <div style={UI.card}>
          <DocumentManager
            user={user}
            title="My Verification Documents"
            documents={docs}
            refreshDocuments={loadDocs}
            defaultCategory="tenant_verification"
            allowUpload={true}
            allowEdit={true}
            allowDelete={true}
          />
        </div>
      </div>
    </div>
  );
}