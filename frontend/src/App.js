import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import MaintenanceList from "./pages/MaintenanceList";
import MaintenanceForm from "./pages/MaintenanceForm";
import TenantDashboard from "./pages/TenantDashboard";
import LandlordDashboard from "./pages/LandlordDashboard";
import Profile from "./pages/Profile";
import ManageProviders from "./pages/ManageProviders";
import FileDispute from "./pages/tenant/FileDispute";
import MyDisputes from "./pages/tenant/MyDisputes";
import MediatorDashboard from "./pages/mediator/MediatorDashboard";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Notifications from "./pages/Notifications";
import LandlordDisputes from "./pages/landlord/LandlordDisputes";
import TenantVerificationDocs from "./pages/tenant/TenantVerificationDocs";
import TenantVerificationView from "./pages/landlord/TenantVerificationView";
import AdminTenantDocsView from "./pages/admin/AdminTenantDocsView";

// add these two
import TenantPayments from "./pages/tenant/TenantPayments";
import LandlordPayments from "./pages/landlord/LandlordPayments";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tenant-dashboard" element={<TenantDashboard />} />
        <Route path="/landlord-dashboard" element={<LandlordDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/disputes" element={<AdminDisputes />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/maintenance" element={<MaintenanceList />} />
        <Route path="/maintenance/new" element={<MaintenanceForm />} />
        <Route path="/admin/providers" element={<ManageProviders />} />
        <Route path="/tenant/file-dispute" element={<FileDispute />} />
        <Route path="/tenant/disputes" element={<MyDisputes />} />
        <Route path="/mediator-dashboard" element={<MediatorDashboard />} />
        <Route path="/landlord/disputes" element={<LandlordDisputes />} />

        {/* add these two */}
        <Route path="/tenant/payments" element={<TenantPayments />} />
        <Route path="/landlord/payments" element={<LandlordPayments />} />
        <Route path="/tenant/verification-docs" element={<TenantVerificationDocs />} />
        <Route path="/landlord/tenant-docs/:tenantId" element={<TenantVerificationView />} />
        <Route path="/admin/tenant-docs/:tenantId" element={<AdminTenantDocsView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;