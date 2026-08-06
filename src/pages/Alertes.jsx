import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { alerteService } from "../services/api";
import {
  MdNotifications,
  MdSearch,
  MdVisibility,
  MdCheckCircle,
  MdWarning,
  MdError,
  MdWater,
  MdCalendarToday,
  MdClose,
  MdBuild,
  MdLocationOn,
  MdPerson,
} from "react-icons/md";

const TYPES_ALERTES = {
  fuite: {
    label: "Fuite probable",
    color: "bg-red-50 text-red-700",
    icon: MdError,
    bg: "bg-red-50",
    iconColor: "text-red-500",
  },
  surconsommation: {
    label: "Surconsommation",
    color: "bg-orange-50 text-orange-700",
    icon: MdWarning,
    bg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  deconnecte: {
    label: "Compteur déconnecté",
    color: "bg-yellow-50 text-yellow-700",
    icon: MdWater,
    bg: "bg-yellow-50",
    iconColor: "text-yellow-500",
  },
};

const STATUTS = {
  en_cours: {
    label: "En cours",
    color: "bg-red-50 text-red-700",
  },
  resolue: {
    label: "Résolue",
    color: "bg-green-50 text-green-700",
  },
};

export default function Alertes() {
  const { user } = useAuth();
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [filtreType, setFiltreType] = useState("tous");
  const [showDetail, setShowDetail] = useState(false);
  const [alerteSelectionnee, setAlerteSelectionnee] = useState(null);
  const [message, setMessage] = useState({ type: "", texte: "" });
  const [loadingResolution, setLoadingResolution] = useState(false);

  useEffect(() => {
    fetchAlertes();
  }, []);

  const fetchAlertes = async () => {
    try {
      const response = await alerteService.getAll();
      setAlertes(response.data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer alertes
  const alertesFiltrees = alertes.filter(a => {
    const matchRecherche =
      a.compteur_detail?.numero_compteur
        ?.toLowerCase()
        .includes(recherche.toLowerCase()) ||
      a.compteur_detail?.client_detail?.first_name
        ?.toLowerCase()
        .includes(recherche.toLowerCase()) ||
      a.compteur_detail?.client_detail?.last_name
        ?.toLowerCase()
        .includes(recherche.toLowerCase());

    const matchStatut = filtreStatut === "tous" || a.statut === filtreStatut;
    const matchType = filtreType === "tous" || a.type_alerte === filtreType;

    return matchRecherche && matchStatut && matchType;
  });

  // Stats
  const stats = {
    total: alertes.length,
    en_cours: alertes.filter(a => a.statut === "en_cours").length,
    resolues: alertes.filter(a => a.statut === "resolue").length,
    fuites: alertes.filter(a => a.type_alerte === "fuite").length,
  };

  // Résoudre une alerte
  const handleResoudre = async alerteId => {
    setLoadingResolution(true);
    try {
      await alerteService.resoudre(alerteId);
      setMessage({ type: "success", texte: "Alerte résolue avec succès !" });
      setShowDetail(false);
      fetchAlertes();
    } catch (error) {
      setMessage({ type: "error", texte: "Erreur lors de la résolution." });
    } finally {
      setLoadingResolution(false);
      setTimeout(() => setMessage({ type: "", texte: "" }), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Message */}
      {message.texte && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <MdCheckCircle className="text-lg flex-shrink-0" />
          ) : (
            <MdError className="text-lg flex-shrink-0" />
          )}
          {message.texte}
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Gestion des Alertes
          </h3>
          <p className="text-sm text-gray-500">
            {alertes.length} alerte(s) au total
          </p>
        </div>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-3 rounded-xl">
              <MdNotifications className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {stats.total}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-3 rounded-xl">
              <MdError className="text-red-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En cours</p>
              <p className="text-xl font-bold text-red-600">{stats.en_cours}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-3 rounded-xl">
              <MdCheckCircle className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Résolues</p>
              <p className="text-xl font-bold text-green-600">
                {stats.resolues}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 p-3 rounded-xl">
              <MdWarning className="text-orange-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Fuites</p>
              <p className="text-xl font-bold text-orange-600">
                {stats.fuites}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        {/* Filtre statut */}
        <div className="flex bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {["tous", "en_cours", "resolue"].map(s => (
            <button
              key={s}
              onClick={() => setFiltreStatut(s)}
              className={`px-4 py-2 text-sm font-medium transition ${
                filtreStatut === s
                  ? "bg-primary-500 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {s === "tous"
                ? "Tous"
                : s === "en_cours"
                  ? "En cours"
                  : "Résolues"}
            </button>
          ))}
        </div>

        {/* Filtre type */}
        <select
          value={filtreType}
          onChange={e => setFiltreType(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
        >
          <option value="tous">Tous les types</option>
          {Object.entries(TYPES_ALERTES).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>

        {/* Recherche */}
        <div className="relative flex-1 min-w-48">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Rechercher par compteur ou client..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        ) : alertesFiltrees.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MdNotifications className="text-5xl mx-auto mb-2 opacity-30" />
            <p>Aucune alerte trouvée</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {[
                  "Type",
                  "Compteur",
                  "Client",
                  "Statut",
                  "Date",
                  "Actions",
                ].map(h => (
                  <th
                    key={h}
                    className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {alertesFiltrees.map(alerte => {
                const type = TYPES_ALERTES[alerte.type_alerte];
                const TypeIcon = type?.icon || MdWarning;
                const statut = STATUTS[alerte.statut];

                return (
                  <tr
                    key={alerte.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {/* Type */}
                    <td className="px-6 py-4">
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit ${type?.color}`}
                      >
                        <TypeIcon className="text-base flex-shrink-0" />
                        <span className="text-xs font-medium">
                          {type?.label || alerte.type_alerte}
                        </span>
                      </div>
                    </td>

                    {/* Compteur */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <MdWater className="text-blue-600 text-sm" />
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                          {alerte.compteur_detail?.numero_compteur || "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-6 py-4">
                      {alerte.compteur_detail?.client_detail ? (
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            {alerte.compteur_detail.client_detail.first_name}{" "}
                            {alerte.compteur_detail.client_detail.last_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {alerte.compteur_detail.client_detail.zone}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Non attribué
                        </span>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${statut?.color}`}
                      >
                        {alerte.statut === "resolue" ? (
                          <MdCheckCircle className="text-sm" />
                        ) : (
                          <MdError className="text-sm" />
                        )}
                        {statut?.label}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <MdCalendarToday className="text-gray-400 text-sm" />
                        {new Date(alerte.date).toLocaleString("fr-FR")}
                      </div>
                      {alerte.date_resolution && (
                        <p className="text-xs text-green-500 mt-1">
                          Résolue :{" "}
                          {new Date(alerte.date_resolution).toLocaleDateString(
                            "fr-FR"
                          )}
                        </p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setAlerteSelectionnee(alerte);
                            setShowDetail(true);
                          }}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                          title="Voir détails"
                        >
                          <MdVisibility />
                        </button>
                        {alerte.statut === "en_cours" && (
                          <button
                            onClick={() => handleResoudre(alerte.id)}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                            title="Résoudre l'alerte"
                          >
                            <MdBuild />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== MODAL DETAIL ===== */}
      {showDetail && alerteSelectionnee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Détails de l'alerte
              </h3>
              <button onClick={() => setShowDetail(false)}>
                <MdClose className="text-gray-400 text-2xl hover:text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Type alerte */}
              {(() => {
                const type = TYPES_ALERTES[alerteSelectionnee.type_alerte];
                const TypeIcon = type?.icon || MdWarning;
                return (
                  <div
                    className={`flex items-center gap-3 p-4 rounded-xl ${type?.bg || "bg-gray-50"}`}
                  >
                    <TypeIcon
                      className={`text-3xl ${type?.iconColor || "text-gray-500"}`}
                    />
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white">
                        {type?.label || alerteSelectionnee.type_alerte}
                      </p>
                      <p className="text-xs text-gray-500">
                        Détectée le{" "}
                        {new Date(alerteSelectionnee.date).toLocaleString(
                          "fr-FR"
                        )}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          STATUTS[alerteSelectionnee.statut]?.color
                        }`}
                      >
                        {STATUTS[alerteSelectionnee.statut]?.label}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Infos compteur */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2">Compteur concerné</p>
                <div className="flex items-center gap-2">
                  <MdWater className="text-blue-500 text-xl" />
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {alerteSelectionnee.compteur_detail?.numero_compteur ||
                      "N/A"}
                  </p>
                </div>
              </div>

              {/* Infos client */}
              {alerteSelectionnee.compteur_detail?.client_detail && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-2">Client</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <MdPerson className="text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {
                          alerteSelectionnee.compteur_detail.client_detail
                            .first_name
                        }{" "}
                        {
                          alerteSelectionnee.compteur_detail.client_detail
                            .last_name
                        }
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MdLocationOn className="text-primary-400" />
                        {alerteSelectionnee.compteur_detail.client_detail
                          .zone || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Date résolution si résolue */}
              {alerteSelectionnee.statut === "resolue" &&
                alerteSelectionnee.date_resolution && (
                  <div className="bg-green-50 dark:bg-green-900 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">
                      Date de résolution
                    </p>
                    <div className="flex items-center gap-2">
                      <MdCheckCircle className="text-green-500" />
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                        {new Date(
                          alerteSelectionnee.date_resolution
                        ).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                )}
            </div>

            <div className="flex gap-3 p-6 border-t dark:border-gray-700 flex-shrink-0">
              <button
                onClick={() => setShowDetail(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 transition"
              >
                Fermer
              </button>
              {alerteSelectionnee.statut === "en_cours" && (
                <button
                  onClick={() => handleResoudre(alerteSelectionnee.id)}
                  disabled={loadingResolution}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition disabled:opacity-50"
                >
                  {loadingResolution ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <MdBuild className="text-lg" />
                  )}
                  Résoudre l'alerte
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
