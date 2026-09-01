import { useAuth } from "../context/AuthContext";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  authService,
  alerteService,
  avisService,
  factureService,
  demandeService,
} from "../services/api";
import {
  MdRefresh,
  MdLightMode,
  MdDarkMode,
  MdPerson,
  MdLogout,
  MdEdit,
  MdNotifications,
  MdWarning,
  MdStar,
  MdReceipt,
  MdError,
  MdCameraAlt,
  MdPersonAdd,
} from "react-icons/md";

export default function Header({ titre }) {
  const { user, deconnexion, theme, toggleTheme, updatePhoto } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const menuRef = useRef();
  const notifsRef = useRef();
  const fileRef = useRef();

  // Fermer menus au clic extérieur
  useEffect(() => {
    const handler = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (notifsRef.current && !notifsRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Charger notifications
  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      // ← Déclarez notifs ICI en dehors de tout bloc
      const notifs = [];

      // Alertes en cours
      try {
        const alertesRes = await alerteService.getAll();
        const alertesEnCours = alertesRes.data.filter(
          a => a.statut === "en_cours"
        );
        alertesEnCours.forEach(a => {
          notifs.push({
            id: `alerte-${a.id}`,
            type: "alerte",
            titre:
              a.type_alerte === "fuite"
                ? "Fuite probable détectée"
                : a.type_alerte === "surconsommation"
                  ? "Surconsommation détectée"
                  : "Compteur déconnecté",
            description: `Compteur ${a.compteur_detail?.numero_compteur || "N/A"}`,
            date: a.date,
            lien: "/admin/alertes",
            couleur: "text-red-500",
            bg: "bg-red-50 dark:bg-red-900",
            icon: MdError,
          });
        });
      } catch (err) {
        console.error("Erreur alertes:", err);
      }

      // Avis en attente
      try {
        const avisRes = await avisService.getAll();
        const avisEnAttente = avisRes.data.filter(
          a => a.statut === "en_attente"
        );
        avisEnAttente.forEach(a => {
          notifs.push({
            id: `avis-${a.id}`,
            type: "avis",
            titre: `Nouvel avis - ${a.note}/5 étoiles`,
            description: `${a.client_detail?.first_name || ""} ${a.client_detail?.last_name || ""}`,
            date: a.date_avis,
            lien: "/admin/avis",
            couleur: "text-yellow-500",
            bg: "bg-yellow-50 dark:bg-yellow-900",
            icon: MdStar,
          });
        });
      } catch (err) {
        console.error("Erreur avis:", err);
      }

      // Factures en retard
      try {
        const facturesRes = await factureService.getAll();
        const facturesEnRetard = facturesRes.data.filter(
          f => f.statut === "en_retard"
        );
        facturesEnRetard.forEach(f => {
          notifs.push({
            id: `facture-${f.id}`,
            type: "facture",
            titre: `Facture #${f.id} en retard`,
            description: `${f.client_detail?.first_name || ""} ${f.client_detail?.last_name || ""}`,
            date: f.date_generation,
            lien: "/admin/factures",
            couleur: "text-orange-500",
            bg: "bg-orange-50 dark:bg-orange-900",
            icon: MdReceipt,
          });
        });
      } catch (err) {
        console.error("Erreur factures:", err);
      }

      // Demandes en attente
      try {
        const demandesRes = await demandeService.getAll();
        const demandesEnAttente = demandesRes.data.filter(
          d => d.statut === "en_attente"
        );
        demandesEnAttente.forEach(d => {
          notifs.push({
            id: `demande-${d.id}`,
            type: "demande",
            titre: "Nouvelle demande d'abonnement",
            description: `${d.prenom} ${d.nom} - ${d.zone}`,
            date: d.date_demande,
            lien: "/admin/demandes",
            couleur: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-900",
            icon: MdPersonAdd,
          });
        });
      } catch (err) {
        console.error("Erreur demandes:", err);
      }

      // Trier par date
      notifs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setNotifications(notifs);
    } catch (error) {
      console.error("Erreur notifications:", error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  // Charger au montage et toutes les 30 secondes
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDeconnexion = async () => {
    await deconnexion();
    navigate("/login");
  };

  const handlePhotoChange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const response = await authService.modifierPhoto(formData);
      updatePhoto(response.data.photo_url);
    } catch (error) {
      console.error("Erreur upload photo:", error);
    }
  };

  // Formater la date
  const formatDate = dateStr => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutes

    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-gray-100 dark:border-gray-700">
      {/* Titre */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          {titre}
        </h2>
        <p className="text-xs text-gray-400">
          {new Date().toLocaleString("fr-FR")}
        </p>
      </div>

      {/* Actions droite */}
      <div className="flex items-center gap-3">
        {/* Refresh */}
        <button
          onClick={() => window.location.reload()}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          title="Actualiser"
        >
          <MdRefresh className="text-gray-500 dark:text-gray-300 text-xl" />
        </button>

        {/* Thème */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          title={theme === "light" ? "Mode sombre" : "Mode clair"}
        >
          {theme === "light" ? (
            <MdDarkMode className="text-gray-500 text-xl" />
          ) : (
            <MdLightMode className="text-yellow-400 text-xl" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifsRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <MdNotifications className="text-gray-500 dark:text-gray-300 text-xl" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              </span>
            )}
          </button>

          {/* Menu notifications */}
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                <h4 className="font-bold text-gray-800 dark:text-white text-sm">
                  Notifications
                </h4>
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {notifications.length}
                </span>
              </div>

              {/* Liste notifications */}
              <div className="max-h-80 overflow-y-auto">
                {loadingNotifs ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MdNotifications className="text-4xl mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucune notification</p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const NotifIcon = notif.icon;
                    return (
                      <button
                        key={notif.id}
                        onClick={() => {
                          setShowNotifs(false);
                          navigate(notif.lien);
                        }}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition border-b dark:border-gray-700 last:border-0 text-left"
                      >
                        <div
                          className={`p-2 rounded-xl flex-shrink-0 ${notif.bg}`}
                        >
                          <NotifIcon className={`text-lg ${notif.couleur}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                            {notif.titre}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {notif.description}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDate(notif.date)}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t dark:border-gray-700 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setShowNotifs(false);
                      navigate("/admin/alertes");
                    }}
                    className="text-xs text-center py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
                  >
                    Voir alertes
                  </button>
                  <button
                    onClick={() => {
                      setShowNotifs(false);
                      navigate("/admin/avis");
                    }}
                    className="text-xs text-center py-1.5 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition font-medium"
                  >
                    Voir avis
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Photo profil + menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
          >
            {user?.photo_url ? (
              <img
                src={user.photo_url}
                alt="Photo profil"
                className="w-8 h-8 rounded-full object-cover border-2 border-primary-300 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">
                  {user?.nom?.charAt(0) || "A"}
                </span>
              </div>
            )}
            <div className="hidden md:block text-left overflow-hidden">
              <p className="text-sm font-semibold text-gray-700 dark:text-white leading-none truncate max-w-32">
                {user?.nom || "Admin"}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.role}</p>
            </div>
          </button>

          {/* Menu déroulant profil */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
              {/* Info utilisateur */}
              <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-700 text-white">
                <div className="flex items-center gap-3">
                  {user?.photo_url ? (
                    <img
                      src={user.photo_url}
                      alt="Profil"
                      className="w-12 h-12 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <span className="text-primary-600 text-xl font-bold">
                        {user?.nom?.charAt(0) || "A"}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-bold">{user?.nom || "Admin"}</p>
                    <p className="text-primary-200 text-xs">{user?.role}</p>
                    {user?.zone && (
                      <p className="text-primary-200 text-xs">{user.zone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-2">
                <button
                  onClick={() => fileRef.current.click()}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm transition"
                >
                  <MdCameraAlt className="text-primary-500" />
                  Changer la photo
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />

                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate("/admin/profil");
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm transition"
                >
                  <MdPerson className="text-blue-500" />
                  Mon profil
                </button>

                <hr className="my-2 border-gray-100 dark:border-gray-700" />

                <button
                  onClick={handleDeconnexion}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 text-sm transition"
                >
                  <MdLogout className="text-red-500" />
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
