import { Routes, Route } from "react-router-dom";

import LandingPage from "./components/pages/LandingPage";
import ServicesPage from "./components/pages/ServicesPage";
import TeamPage from "./components/pages/TeamPage";
import ContactPage from "./components/pages/ContactPage";
import PrivacyPage from "./components/pages/PrivacyPage";
import PassportPage from "./components/pages/PassportPage";
import AdminPage from "./components/pages/AdminPage";
import PublicLayout from "./components/templates/PublicLayout";
import AdvisoryThemeLayout from "./components/templates/AdvisoryThemeLayout";
import PassportThemeLayout from "./components/templates/PassportThemeLayout";
import AdminRoute from "./routes/AdminRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import ApiSanityWarning from "./components/atoms/ApiSanityWarning";
import { useApiSanityCheck } from "./hooks/useApiSanityCheck";

export default function App() {
  const { warning } = useApiSanityCheck();

  return (
    <>
      <ApiSanityWarning warning={warning} />
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
                <Route element={<AdvisoryThemeLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/team" element={<TeamPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route
                    path="/privacy"
                    element={
                      <ProtectedRoute>
                        <PrivacyPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                <Route element={<PassportThemeLayout />}>
                  <Route path="/passport" element={<PassportPage />} />
                </Route>
              </Routes>
            </PublicLayout>
          }
        />
      </Routes>
    </>
  );
}
