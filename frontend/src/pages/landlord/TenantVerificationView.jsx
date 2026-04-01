import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTenantVerificationDocs } from "../../api/evidenceAPI";
import DocumentManager from "../../components/DocumentManager";
import { UI, BTN } from "../../styles/ui";

export default function TenantVerificationView() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [docs, setDocs] = useState([]);

  const loadDocs = async () => {
    try {
      const res = await getTenantVerificationDocs(tenantId);
      setDocs(res.data.data || []);
    } catch {
      setDocs([]);
    }
  };

  useEffect(() => {
    if (tenantId) loadDocs();
  }, [tenantId]);

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
          <h1 style={UI.heroTitle}>Tenant Verification Documents</h1>
          <p style={UI.heroText}>Review uploaded tenant personal documents.</p>
        </div>

        <div style={UI.card}>
          <DocumentManager
            user={user}
            title="Tenant Verification Documents"
            documents={docs}
            refreshDocuments={loadDocs}
            defaultCategory="tenant_verification"
            allowUpload={false}
            allowEdit={false}
            allowDelete={false}
          />
        </div>
      </div>
    </div>
  );
}