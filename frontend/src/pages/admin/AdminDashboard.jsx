import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import {
  registerUser,
  getUsersByRole,
  getAllProperties,
  createProperty,
  getUnassignedTenants,
  assignTenant,
  addProvider,
} from "../../api/adminAPI";
import { getTenancyEvidence } from "../../api/evidenceAPI";
import { setupTenancyRent } from "../../api/paymentAPI";
import DocumentManager from "../../components/DocumentManager";
import { UI, BTN } from "../../styles/ui";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [message, setMessage] = useState("");

  const [landlords, setLandlords] = useState([]);
  const [allTenants, setAllTenants] = useState([]);
  const [unassignedTenants, setUnassignedTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [providers, setProviders] = useState([]);
  const [allTenancies, setAllTenancies] = useState([]);

  const [activeTenancyId, setActiveTenancyId] = useState(null);
  const [tenancyDocs, setTenancyDocs] = useState([]);

  const [landlordForm, setLandlordForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [propertyForm, setPropertyForm] = useState({
    landlord_id: "",
    address: "",
    description: "",
  });

  const [providerForm, setProviderForm] = useState({
    name: "",
    contact_info: "",
    service_type: "",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    tenant_id: "",
    property_id: "",
  });

  const [rentForm, setRentForm] = useState({
    tenancy_id: "",
    monthly_rent: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        landlordRes,
        tenantRes,
        unassignedRes,
        propertyRes,
        providerRes,
      ] = await Promise.all([
        getUsersByRole("landlord"),
        getUsersByRole("tenant"),
        getUnassignedTenants(),
        getAllProperties(),
        API.get("/providers/"),
      ]);

      const landlordsData = landlordRes.data.data || [];
      const allTenantsData = tenantRes.data.data || [];

      setLandlords(landlordsData);
      setAllTenants(allTenantsData);
      setUnassignedTenants(unassignedRes.data.data || []);
      setProperties(propertyRes.data.data || []);
      setProviders(providerRes.data.data || []);

      let mergedTenancies = [];
      for (const landlord of landlordsData) {
        try {
          const res = await API.get(`/tenancy/landlord/${landlord.id}`);
          mergedTenancies = [...mergedTenancies, ...(res.data.data || [])];
        } catch {}
      }
      setAllTenancies(mergedTenancies);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to load admin data.");
    }
  };

  const refreshTenancyDocs = async () => {
    if (!activeTenancyId) return;
    try {
      const res = await getTenancyEvidence(activeTenancyId);
      setTenancyDocs(res.data.data || []);
    } catch {
      setTenancyDocs([]);
    }
  };

  const handleCreateLandlord = async () => {
    try {
      await registerUser({ ...landlordForm, role: "landlord" });
      setMessage("Landlord added successfully.");
      setLandlordForm({ name: "", email: "", password: "", phone: "" });
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to add landlord.");
    }
  };

  const handleCreateProperty = async () => {
    try {
      await createProperty({
        landlord_id: parseInt(propertyForm.landlord_id, 10),
        address: propertyForm.address,
        description: propertyForm.description,
      });
      setMessage("Property added successfully.");
      setPropertyForm({ landlord_id: "", address: "", description: "" });
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to add property.");
    }
  };

  const handleCreateProvider = async () => {
    try {
      await addProvider(providerForm);
      setMessage("Service provider added successfully.");
      setProviderForm({ name: "", contact_info: "", service_type: "" });
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to add provider.");
    }
  };

  const handleAssignTenant = async () => {
    try {
      const res = await assignTenant({
        tenant_id: parseInt(assignmentForm.tenant_id, 10),
        property_id: parseInt(assignmentForm.property_id, 10),
      });

      const tenancyId = res.data.data?.tenancy_id;
      setActiveTenancyId(tenancyId || null);
      setAssignmentForm({ tenant_id: "", property_id: "" });
      setMessage("Tenant assigned successfully. You can upload lease/house docs below.");
      await loadData();

      if (tenancyId) {
        const docsRes = await getTenancyEvidence(tenancyId);
        setTenancyDocs(docsRes.data.data || []);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to assign tenant.");
    }
  };

  const handleSetRent = async () => {
    try {
      await setupTenancyRent({
        tenancy_id: parseInt(rentForm.tenancy_id, 10),
        monthly_rent: parseFloat(rentForm.monthly_rent),
      });
      setMessage("Monthly rent set successfully.");
      setRentForm({ tenancy_id: "", monthly_rent: "" });
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to set rent.");
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const openTenantDocs = (tenantId) => {
    navigate(`/admin/tenant-docs/${tenantId}`);
  };

  return (
    <div style={UI.page}>
      <nav style={UI.navbar}>
        <div style={UI.brand}>🏠 PropManager Admin</div>
        <div style={UI.navActions}>
          <button onClick={() => navigate("/notifications")} style={BTN.primary}>
            Notifications
          </button>
          <button onClick={logout} style={BTN.danger}>
            Logout
          </button>
        </div>
      </nav>

      <div style={UI.container}>
        <div style={UI.hero}>
          <h1 style={UI.heroTitle}>Admin Dashboard</h1>
          <p style={UI.heroText}>
            Manage landlords, tenants, properties, providers, rents, and tenancy documents.
          </p>
        </div>

        {message && <div style={UI.message}>{message}</div>}

        <div
          style={{
            ...UI.card,
            marginBottom: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            background: "linear-gradient(135deg, #fff7ed, #ffe4e6)",
            border: "1px solid #fed7aa",
          }}
        >
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>
              Dispute Management
            </div>
            <div style={{ color: "#6b7280", marginTop: 6 }}>
              Review disputes, assign mediators, inspect evidence, and resolve cases.
            </div>
          </div>

          <button
            onClick={() => navigate("/admin/disputes")}
            style={{
              ...BTN.primary,
              background: "linear-gradient(135deg, #ef4444, #f97316)",
              minWidth: 190,
            }}
          >
            Open Disputes Page
          </button>
        </div>

        <div style={UI.grid4}>
          <section style={UI.card}>
            <h3 style={UI.sectionTitle}>Add Landlord</h3>
            <input
              style={UI.input}
              placeholder="Name"
              value={landlordForm.name}
              onChange={(e) => setLandlordForm({ ...landlordForm, name: e.target.value })}
            />
            <input
              style={UI.input}
              placeholder="Email"
              value={landlordForm.email}
              onChange={(e) => setLandlordForm({ ...landlordForm, email: e.target.value })}
            />
            <input
              style={UI.input}
              placeholder="Password"
              type="password"
              value={landlordForm.password}
              onChange={(e) => setLandlordForm({ ...landlordForm, password: e.target.value })}
            />
            <input
              style={UI.input}
              placeholder="Phone"
              value={landlordForm.phone}
              onChange={(e) => setLandlordForm({ ...landlordForm, phone: e.target.value })}
            />
            <button style={{ ...BTN.success, width: "100%" }} onClick={handleCreateLandlord}>
              Add Landlord
            </button>
          </section>

          <section style={UI.card}>
            <h3 style={UI.sectionTitle}>Add Property</h3>
            <select
              style={UI.input}
              value={propertyForm.landlord_id}
              onChange={(e) => setPropertyForm({ ...propertyForm, landlord_id: e.target.value })}
            >
              <option value="">Select landlord</option>
              {landlords.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.email})
                </option>
              ))}
            </select>
            <input
              style={UI.input}
              placeholder="Address"
              value={propertyForm.address}
              onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
            />
            <input
              style={UI.input}
              placeholder="Description"
              value={propertyForm.description}
              onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
            />
            <button style={{ ...BTN.success, width: "100%" }} onClick={handleCreateProperty}>
              Add Property
            </button>
          </section>

          <section style={UI.card}>
            <h3 style={UI.sectionTitle}>Add Service Provider</h3>
            <input
              style={UI.input}
              placeholder="Provider name"
              value={providerForm.name}
              onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
            />
            <input
              style={UI.input}
              placeholder="Contact info"
              value={providerForm.contact_info}
              onChange={(e) => setProviderForm({ ...providerForm, contact_info: e.target.value })}
            />
            <input
              style={UI.input}
              placeholder="Service type"
              value={providerForm.service_type}
              onChange={(e) => setProviderForm({ ...providerForm, service_type: e.target.value })}
            />
            <button style={{ ...BTN.success, width: "100%" }} onClick={handleCreateProvider}>
              Add Provider
            </button>
          </section>

          <section style={UI.card}>
            <h3 style={UI.sectionTitle}>Assign Tenant</h3>
            <select
              style={UI.input}
              value={assignmentForm.tenant_id}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, tenant_id: e.target.value })}
            >
              <option value="">Select tenant</option>
              {unassignedTenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>

            <select
              style={UI.input}
              value={assignmentForm.property_id}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, property_id: e.target.value })}
            >
              <option value="">Select property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address} {p.landlord_name ? `— ${p.landlord_name}` : ""}
                </option>
              ))}
            </select>

            <button style={{ ...BTN.success, width: "100%" }} onClick={handleAssignTenant}>
              Assign Tenant
            </button>
          </section>
        </div>

       <div style={{ marginTop: 18 }}>
  <section style={UI.card}>
    <h3 style={UI.sectionTitle}>Set Monthly Rent</h3>

    <select
      style={UI.input}
      value={rentForm.tenancy_id}
      onChange={(e) =>
        setRentForm({ ...rentForm, tenancy_id: e.target.value })
      }
    >
      <option value="">Select tenancy</option>
      {allTenancies.map((t) => (
        <option key={t.tenancy_id} value={t.tenancy_id}>
          {t.tenant_name} — {t.property_address}
        </option>
      ))}
    </select>

    <input
      style={UI.input}
      type="number"
      placeholder="Monthly rent"
      value={rentForm.monthly_rent}
      onChange={(e) =>
        setRentForm({ ...rentForm, monthly_rent: e.target.value })
      }
    />

    <button
      style={{ ...BTN.success, width: "100%" }}
      onClick={handleSetRent}
    >
      Save Monthly Rent
    </button>
  </section>
</div>

        {activeTenancyId && (
          <div style={{ marginTop: 18 }}>
            <section style={UI.card}>
              <DocumentManager
                user={user}
                title="Lease & House Documents"
                documents={tenancyDocs}
                refreshDocuments={refreshTenancyDocs}
                tenancyId={activeTenancyId}
                defaultCategory="lease_agreement"
                allowUpload={true}
                allowEdit={true}
                allowDelete={true}
              />
            </section>
          </div>
        )}

        <div style={{ ...UI.grid3, marginTop: 18 }}>
          <section style={UI.card}>
            <h3 style={UI.sectionTitle}>All Tenants</h3>
            {allTenants.length === 0 ? (
              <div style={{ color: "#64748b" }}>No tenants found.</div>
            ) : (
              allTenants.map((t) => (
                <div key={t.id} style={{ ...UI.item, marginBottom: 10 }}>
                  <div style={UI.itemTitle}>{t.name}</div>
                  <div style={UI.itemSub}>{t.email}</div>
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => openTenantDocs(t.id)} style={BTN.secondary}>
                      View Docs
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section style={UI.card}>
            <h3 style={UI.sectionTitle}>All Properties</h3>
            {properties.length === 0 ? (
              <div style={{ color: "#64748b" }}>No properties found.</div>
            ) : (
              properties.map((p) => (
                <div key={p.id} style={{ ...UI.item, marginBottom: 10 }}>
                  <div style={UI.itemTitle}>{p.address}</div>
                  <div style={UI.itemSub}>{p.description || "No description"}</div>
                  {p.landlord_name && <div style={UI.itemSub}>Landlord: {p.landlord_name}</div>}
                </div>
              ))
            )}
          </section>

          <section style={UI.card}>
            <h3 style={UI.sectionTitle}>All Providers</h3>
            {providers.length === 0 ? (
              <div style={{ color: "#64748b" }}>No providers found.</div>
            ) : (
              providers.map((p) => (
                <div key={p.id} style={{ ...UI.item, marginBottom: 10 }}>
                  <div style={UI.itemTitle}>{p.name}</div>
                  <div style={UI.itemSub}>{p.service_type || "No service type"}</div>
                  <div style={UI.itemSub}>{p.contact_info || "No contact info"}</div>
                </div>
              ))
            )}
          </section>
        </div>

        <div style={{ ...UI.grid2, marginTop: 18 }}>
          <section style={UI.card}>
            <h3 style={UI.sectionTitle}>Landlords</h3>
            {landlords.length === 0 ? (
              <div style={{ color: "#64748b" }}>No landlords found.</div>
            ) : (
              landlords.map((l) => (
                <div key={l.id} style={{ ...UI.item, marginBottom: 10 }}>
                  <div style={UI.itemTitle}>{l.name}</div>
                  <div style={UI.itemSub}>{l.email}</div>
                  <div style={UI.itemSub}>{l.phone || "No phone"}</div>
                </div>
              ))
            )}
          </section>

          <section style={UI.card}>
            <h3 style={UI.sectionTitle}>Tenancies</h3>
            {allTenancies.length === 0 ? (
              <div style={{ color: "#64748b" }}>No tenancies found.</div>
            ) : (
              allTenancies.map((t) => (
                <div key={t.tenancy_id} style={{ ...UI.item, marginBottom: 10 }}>
                  <div style={UI.itemTitle}>
                    {t.tenant_name} — {t.property_address}
                  </div>
                  <div style={UI.itemSub}>
                    Rent: {t.monthly_rent ? `PKR ${t.monthly_rent}` : "Not set"}
                  </div>
                  <div style={UI.itemSub}>
                    Start: {t.start_date || "N/A"} {t.end_date ? `| End: ${t.end_date}` : ""}
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