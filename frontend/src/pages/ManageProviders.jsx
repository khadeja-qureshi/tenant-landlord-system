import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addProvider, getProviders } from "../api/providerAPI";
import { UI, BTN } from "../styles/ui";

export default function ManageProviders() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    contact_info: "",
    service_type: "",
  });

  const loadProviders = async () => {
    try {
      const res = await getProviders();
      setProviders(res.data.data || []);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to load providers.");
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleAdd = async () => {
    if (!form.name || !form.service_type) {
      setMessage("Name and service type are required.");
      return;
    }

    try {
      await addProvider(form);
      setMessage("Service provider added successfully.");
      setForm({
        name: "",
        contact_info: "",
        service_type: "",
      });
      loadProviders();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to add provider.");
    }
  };

  return (
    <div style={UI.page}>
      <nav style={UI.navbar}>
        <div style={UI.brand}>🏠 PropManager Admin</div>
        <div style={UI.navActions}>
          <button onClick={() => navigate("/admin-dashboard")} style={BTN.secondary}>
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
          <h1 style={UI.heroTitle}>Service Providers</h1>
          <p style={UI.heroText}>Add and view service providers.</p>
        </div>

        {message && <div style={UI.message}>{message}</div>}

        <div style={{ ...UI.grid3, marginBottom: 18 }}>
          <section style={UI.card}>
            <h3 style={UI.sectionTitle}>Add Provider</h3>
            <input
              style={UI.input}
              placeholder="Provider name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              style={UI.input}
              placeholder="Contact info"
              value={form.contact_info}
              onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
            />
            <input
              style={UI.input}
              placeholder="Service type"
              value={form.service_type}
              onChange={(e) => setForm({ ...form, service_type: e.target.value })}
            />
            <button style={{ ...BTN.success, width: "100%" }} onClick={handleAdd}>
              Add Provider
            </button>
          </section>

          <section style={{ ...UI.card, gridColumn: "span 2" }}>
            <h3 style={UI.sectionTitle}>All Providers</h3>

            {providers.length === 0 ? (
              <div style={UI.emptyBox}>No service providers yet.</div>
            ) : (
              providers.map((provider) => (
                <div key={provider.id} style={{ ...UI.item, marginBottom: 10 }}>
                  <div style={UI.itemTitle}>{provider.name}</div>
                  <div style={UI.itemSub}>
                    {provider.service_type} • {provider.contact_info || "No contact info"}
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