import { Routes, Route } from "react-router-dom";

import LandingPage from "./components/pages/LandingPage";
import ServicesPage from "./components/pages/ServicesPage";
import TeamPage from "./components/pages/TeamPage";
import ContactPage from "./components/pages/ContactPage";
import PrivacyPage from "./components/pages/PrivacyPage";
import AdminPage from "./components/pages/AdminPage";
import PublicLayout from "./components/templates/PublicLayout";
import AdminRoute from "./routes/AdminRoute";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />
      <Route
        path="*"
        element={
          <PublicLayout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<ProtectedRoute><PrivacyPage /></ProtectedRoute>} />
            </Routes>
          </PublicLayout>
        }
      />
    </Routes>
  );
}
