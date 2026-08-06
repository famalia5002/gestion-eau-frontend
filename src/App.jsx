import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Profil from "./pages/Profil";
import MonProfil from "./pages/MonProfil";
import AdminsZones from "./pages/AdminsZones";
import Compteurs from "./pages/Compteurs";
import Consommation from "./pages/Consommation";
import Factures from "./pages/Factures";
import IndexCompteur from "./pages/IndexCompteur";
import Alertes from "./pages/Alertes";
import Avis from "./pages/Avis";

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Routes Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["super_admin", "admin_zone"]}>
              <Layout titre="Tableau de bord" />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="profil" element={<MonProfil />} />
          <Route path="admins-zones" element={<AdminsZones />} />
          <Route path="compteurs" element={<Compteurs />} />
          <Route path="consommation" element={<Consommation />} />
          <Route path="factures" element={<Factures />} />
          <Route path="compteurs/:id/index" element={<IndexCompteur />} />
          <Route path="alertes" element={<Alertes />} />
          <Route path="avis" element={<Avis />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
