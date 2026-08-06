import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
export default function Layout() {
  const location = useLocation();

  const titres = {
    "/admin/dashboard": "Tableau de bord",
    "/admin/clients": "Gestion des clients",
    "/admin/compteurs": "Gestion des compteurs",
    "/admin/consommation": "Suivi de consommation",
    "/admin/factures": "Gestion des factures",
    "/admin/alertes": "Gestion des alertes",
    "/admin/avis": "Avis des clients",
  };

  const titre = titres[location.pathname] || "Dashboard";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Header titre={titre} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
