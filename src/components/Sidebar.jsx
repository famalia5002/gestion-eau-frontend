import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MdWaterDrop } from "react-icons/md";
import logo from "../assets/logo.jpg";
import {
  MdDashboard,
  MdPeople,
  MdWater,
  MdShowChart,
  MdReceipt,
  MdNotifications,
  MdStar,
  MdLogout,
  MdSettings,
  MdAdminPanelSettings,
} from "react-icons/md";

const menuItems = [
  { path: "/admin/dashboard", icon: MdDashboard, label: "Tableau de bord" },
  { path: "/admin/clients", icon: MdPeople, label: "Clients" },
  { path: "/admin/compteurs", icon: MdWater, label: "Compteurs" },
  { path: "/admin/consommation", icon: MdShowChart, label: "Consommation" },
  { path: "/admin/factures", icon: MdReceipt, label: "Factures" },
  { path: "/admin/alertes", icon: MdNotifications, label: "Alertes" },
  { path: "/admin/avis", icon: MdStar, label: "Avis clients" },
];

const menuSuperAdmin = [
  {
    path: "/admin/admins-zones",
    icon: MdAdminPanelSettings,
    label: "Admins Zones",
  },
];

export default function Sidebar() {
  const { user, deconnexion } = useAuth();
  const navigate = useNavigate();

  const handleDeconnexion = async () => {
    await deconnexion();
    navigate("/login");
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-primary-900 to-primary-700 text-white flex flex-col shadow-xl z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-primary-600">
        <img
          src={logo}
          alt="Logo Smart Ndiyam"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h1 className="font-bold text-lg text-white">Smart Ndiyam</h1>
          <p className="text-primary-200 text-xs">Gestion d'eau IoT</p>
        </div>
      </div>

      {/* Info utilisateur */}
      <div className="px-4 py-4 border-b border-primary-600">
        <div className="bg-primary-800 rounded-xl p-3">
          <p className="font-semibold text-sm truncate">
            {user?.nom || user?.username}
          </p>
          <span className="text-xs bg-primary-500 px-2 py-0.5 rounded-full mt-1 inline-block">
            {user?.role === "super_admin"
              ? " Super Admin"
              : user?.role === "admin_zone"
                ? ` Admin - ${user?.zone}`
                : "Client"}
          </span>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium
              ${
                isActive
                  ? "bg-white text-primary-700 shadow-md"
                  : "text-primary-100 hover:bg-primary-600"
              }`
            }
          >
            <item.icon className="text-xl flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
        {/* Séparateur + menu super admin */}
        {user?.role === "super_admin" && (
          <>
            <div className="border-t border-primary-600 my-3" />
            <p className="text-primary-300 text-xs px-4 mb-2 uppercase font-semibold">
              Super Admin
            </p>
            {menuSuperAdmin.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium
                        ${
                          isActive
                            ? "bg-white text-primary-700 shadow-md"
                            : "text-primary-100 hover:bg-primary-600"
                        }`
                }
              >
                <item.icon className="text-xl flex-shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Déconnexion */}
      <div className="p-4 border-t border-primary-600">
        <button
          onClick={handleDeconnexion}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-primary-100 hover:bg-red-500 hover:text-white transition-all duration-200 text-sm font-medium"
        >
          <MdLogout className="text-xl" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
