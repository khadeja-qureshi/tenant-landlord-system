import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { UI, BTN } from "../styles/ui";

export default function LandlordDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [tenancies, setTenancies] = useState([]);
  const [properties, setProperties] = useState([]);
  const [disputes, setDisputes] = useState([]);

  useEffect(() => {
    fetchRequests();
    fetchTenancies();
    fetchProperties();
    fetchDisputes();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await API.get("/maintenance/");
      const all = res.data.data || [];
      const mine = all.filter((r) => Number(r.landlord_id) === Number(user.id));
      setRequests(mine);
    } catch {
      setRequests([]);
    }
  };

  const fetchTenancies = async () => {
    try {
      const res = await API.get(`/tenancy/landlord/${user.id}`);
      setTenancies(res.data.data || []);
    } catch {
      setTenancies([]);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await API.get(`/properties/?landlord_id=${user.id}`);
      setProperties(res.data.data || []);
    } catch {
      setProperties([]);
    }
  };

  const fetchDisputes = async () => {
    try {
      const res = await API.get(`/disputes/landlord/${user.id}`);
      setDisputes(res.data.data || []);
    } catch {
      setDisputes([]);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div style={UI.page}>
      <nav style={UI.navbar}>
        <div style={UI.brand}>🏠 PropManager</div>
        <div style={UI.navActions}>
          <button onClick={() => navigate("/maintenance")} style={BTN.primary}>
            Requests
          </button>
          <button onClick={() => navigate("/landlord/payments")} style={BTN.secondary}>
            Payments
          </button>
          <button onClick={() => navigate("/notifications")} style={BTN.secondary}>
            Notifications
          </button>
          <button onClick={logout} style={BTN.danger}>
            Logout
          </button>
        </div>
      </nav>

      <div style={UI.container}>
        <div style={{ ...UI.hero, background: "linear-gradient(135deg, #0f766e, #2563eb)" }}>
          <h1 style={UI.heroTitle}>Landlord Dashboard</h1>
          <p style={UI.heroText}>
            View your properties, tenants, maintenance requests, disputes, and rent activity.
          </p>
        </div>

        <div style={{ ...UI.grid4, marginBottom: 18 }}>
          <div style={UI.statCard}>
            <div style={UI.statValue}>{properties.length}</div>
            <div style={UI.statLabel}>Properties</div>
          </div>
          <div style={UI.statCard}>
            <div style={UI.statValue}>{tenancies.length}</div>
            <div style={UI.statLabel}>Assigned Tenants</div>
          </div>
          <div style={UI.statCard}>
            <div style={UI.statValue}>{requests.length}</div>
            <div style={UI.statLabel}>Maintenance Requests</div>
          </div>
          <div style={UI.statCard}>
            <div style={UI.statValue}>{disputes.length}</div>
            <div style={UI.statLabel}>Disputes</div>
          </div>
        </div>

        <div style={UI.grid3}>
          <section style={UI.card}>
            <h3 style={UI.sectionTitle}>My Properties</h3>
            {properties.length === 0 ? (
              <div style={{ color: "#64748b" }}>No properties found.</div>
            ) : (
              properties.map((p) => (
                <div key={p.id} style={{ ...UI.item, marginBottom: 10 }}>
                  <div style={UI.itemTitle}>{p.address}</div>
                  <div style={UI.itemSub}>{p.description || "No description"}</div>
                </div>
              ))
            )}
          </section>

          <section style={UI.card}>
            <h3 style={UI.sectionTitle}>Assigned Tenants</h3>
            {tenancies.length === 0 ? (
              <div style={{ color: "#64748b" }}>No tenants assigned yet.</div>
            ) : (
              tenancies.map((t) => (
                <div key={t.tenancy_id} style={{ ...UI.item, marginBottom: 10 }}>
                  <div style={UI.itemTitle}>{t.tenant_name}</div>
                  <div style={UI.itemSub}>
                    {t.tenant_email} • {t.property_address}
                  </div>
                  <div style={UI.itemSub}>
                    Rent: {t.monthly_rent ? `PKR ${t.monthly_rent}` : "Not set"}
                  </div>
                  <button
  onClick={() => navigate(`/landlord/tenant-docs/${t.tenant_id}`)}
  style={BTN.secondary}
>
  View Docs
</button>
                </div>
              ))
            )}
          </section>

          <section style={UI.card}>
            <h3 style={UI.sectionTitle}>Quick Actions</h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => navigate("/maintenance")} style={BTN.primary}>
                Open Requests
              </button>
              <button onClick={() => navigate("/landlord/disputes")} style={BTN.secondary}>
                Disputes
              </button>
              <button onClick={() => navigate("/landlord/payments")} style={BTN.secondary}>
                Payments
              </button>
              <button onClick={() => navigate("/notifications")} style={BTN.secondary}>
                View Notifications
              </button>
              <button onClick={() => navigate("/profile")} style={BTN.secondary}>
                Profile
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}