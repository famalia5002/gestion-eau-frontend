import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { demandeService } from "../services/api";
import { useNavigate } from "react-router-dom";
import {
  MdPersonAdd,
  MdSearch,
  MdVisibility,
  MdCheckCircle,
  MdCancel,
  MdPending,
  MdClose,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdDescription,
  MdWarning,
  MdHome,
  MdKey,
  MdPerson,
} from "react-icons/md";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const STATUTS = {
  en_attente: {
    label: "En attente",
    color: "bg-yellow-50 text-yellow-700",
    icon: MdPending,
  },
  acceptee: {
    label: "Acceptée",
    color: "bg-green-50 text-green-700",
    icon: MdCheckCircle,
  },
  refusee: {
    label: "Refusée",
    color: "bg-red-50 text-red-700",
    icon: MdCancel,
  },
};

export default function Demandes() {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [showDetail, setShowDetail] = useState(false);
  const [showRefus, setShowRefus] = useState(false);
  const [showSucces, setShowSucces] = useState(false);
  const [demandeSelectionnee, setDemandeSelectionnee] = useState(null);
  const [motifRefus, setMotifRefus] = useState("");
  const [compteCreer, setCompteCreer] = useState(null);
  const [message, setMessage] = useState({ type: "", texte: "" });
  const [loadingAction, setLoadingAction] = useState(false);
  const [position, setPosition] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    try {
      const response = await demandeService.getAll();
      setDemandes(response.data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const demandesFiltrees = demandes.filter(d => {
    const matchRecherche =
      d.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      d.prenom?.toLowerCase().includes(recherche.toLowerCase()) ||
      d.email?.toLowerCase().includes(recherche.toLowerCase()) ||
      d.zone?.toLowerCase().includes(recherche.toLowerCase());
    const matchStatut = filtreStatut === "tous" || d.statut === filtreStatut;
    return matchRecherche && matchStatut;
  });

  const stats = {
    total: demandes.length,
    en_attente: demandes.filter(d => d.statut === "en_attente").length,
    acceptees: demandes.filter(d => d.statut === "acceptee").length,
    refusees: demandes.filter(d => d.statut === "refusee").length,
  };

  const handleAccepter = demande => {
    localStorage.setItem("demande_a_traiter", JSON.stringify(demande));
    setShowDetail(false);
    navigate("/admin/clients?from=demande&id=" + demande.id);
  };

  const handleRefuser = async () => {
    if (!motifRefus.trim()) return;
    setLoadingAction(true);
    try {
      await demandeService.traiter(demandeSelectionnee.id, {
        action: "refuser",
        motif_refus: motifRefus,
      });
      setMessage({ type: "success", texte: "Demande refusée." });
      setShowRefus(false);
      setShowDetail(false);
      setMotifRefus("");
      fetchDemandes();
    } catch (error) {
      setMessage({ type: "error", texte: "Erreur lors du refus." });
    } finally {
      setLoadingAction(false);
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
            <MdCheckCircle className="flex-shrink-0 text-lg" />
          ) : (
            <MdWarning className="flex-shrink-0 text-lg" />
          )}
          {message.texte}
        </div>
      )}

      {/* En-tête */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
          Demandes d'abonnement
        </h3>
        <p className="text-sm text-gray-500">
          {demandes.length} demande(s) au total
        </p>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-3 rounded-xl">
              <MdPersonAdd className="text-blue-600 text-xl" />
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
            <div className="bg-yellow-50 p-3 rounded-xl">
              <MdPending className="text-yellow-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En attente</p>
              <p className="text-xl font-bold text-yellow-600">
                {stats.en_attente}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-3 rounded-xl">
              <MdCheckCircle className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Acceptées</p>
              <p className="text-xl font-bold text-green-600">
                {stats.acceptees}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-3 rounded-xl">
              <MdCancel className="text-red-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Refusées</p>
              <p className="text-xl font-bold text-red-600">{stats.refusees}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {["tous", "en_attente", "acceptee", "refusee"].map(s => (
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
                : s === "en_attente"
                  ? "En attente"
                  : s === "acceptee"
                    ? "Acceptées"
                    : "Refusées"}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, zone..."
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
        ) : demandesFiltrees.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MdPersonAdd className="text-5xl mx-auto mb-2 opacity-30" />
            <p>Aucune demande trouvée</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {[
                  "Demandeur",
                  "Contact",
                  "Zone",
                  "Type",
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
              {demandesFiltrees.map(demande => {
                const statut = STATUTS[demande.statut];
                const StatutIcon = statut?.icon || MdPending;
                return (
                  <tr
                    key={demande.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-bold text-sm">
                            {demande.prenom?.charAt(0)}
                            {demande.nom?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white text-sm">
                            {demande.prenom} {demande.nom}
                          </p>
                          <p className="text-xs text-gray-400">#{demande.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                          <MdEmail className="text-gray-400 flex-shrink-0 text-sm" />
                          <span className="truncate max-w-36">
                            {demande.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                          <MdPhone className="text-gray-400 flex-shrink-0 text-sm" />
                          {demande.telephone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <MdLocationOn className="text-primary-400 text-sm" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {demande.zone}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {demande.type_client === "proprietaire" ? (
                          <MdHome className="text-blue-400 text-sm" />
                        ) : (
                          <MdKey className="text-purple-400 text-sm" />
                        )}
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {demande.type_client}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${statut?.color}`}
                      >
                        <StatutIcon className="text-sm" />
                        {statut?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(demande.date_demande).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setDemandeSelectionnee(demande);
                          setPosition(
                            demande.latitude && demande.longitude
                              ? {
                                  lat: demande.latitude,
                                  lng: demande.longitude,
                                }
                              : null
                          );
                          setShowDetail(true);
                        }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                        title="Voir détails"
                      >
                        <MdVisibility />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== MODAL DETAIL ===== */}
      {showDetail && demandeSelectionnee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  Demande #{demandeSelectionnee.id}
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    STATUTS[demandeSelectionnee.statut]?.color
                  }`}
                >
                  {STATUTS[demandeSelectionnee.statut]?.label}
                </span>
              </div>
              <button onClick={() => setShowDetail(false)}>
                <MdClose className="text-gray-400 text-2xl hover:text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Infos personnelles */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">
                  Informations personnelles
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Nom complet</p>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {demandeSelectionnee.prenom} {demandeSelectionnee.nom}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Type</p>
                    <p className="font-medium text-gray-800 dark:text-white capitalize">
                      {demandeSelectionnee.type_client}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <MdEmail className="text-primary-400 text-sm" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {demandeSelectionnee.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <MdPhone className="text-primary-400 text-sm" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {demandeSelectionnee.telephone}
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <MdLocationOn className="text-primary-400 text-sm flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {demandeSelectionnee.adresse} - {demandeSelectionnee.zone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents fournis */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">
                  Documents fournis
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* CIN */}
                  <div className="flex items-center gap-2">
                    {demandeSelectionnee.photo_cin_url ? (
                      <a
                        href={demandeSelectionnee.photo_cin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        <MdDescription className="text-lg" />
                        CIN / Passeport
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <MdDescription className="text-lg opacity-30" />
                        <span className="opacity-50">CIN / Passeport</span>
                      </div>
                    )}
                  </div>

                  {/* Attestation */}
                  <div className="flex items-center gap-2">
                    {demandeSelectionnee.photo_attestation_url ? (
                      <a
                        href={demandeSelectionnee.photo_attestation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        <MdDescription className="text-lg" />
                        Attestation propriétaire
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <MdDescription className="text-lg opacity-30" />
                        <span className="opacity-50">
                          Attestation propriétaire
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contrat */}
                  <div className="flex items-center gap-2">
                    {demandeSelectionnee.photo_contrat_url ? (
                      <a
                        href={demandeSelectionnee.photo_contrat_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        <MdDescription className="text-lg" />
                        Contrat de location
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <MdDescription className="text-lg opacity-30" />
                        <span className="opacity-50">Contrat de location</span>
                      </div>
                    )}
                  </div>

                  {/* Convention */}
                  <div className="flex items-center gap-2">
                    {demandeSelectionnee.photo_convention_url ? (
                      <a
                        href={demandeSelectionnee.photo_convention_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        <MdDescription className="text-lg" />
                        Convention compteurs
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <MdDescription className="text-lg opacity-30" />
                        <span className="opacity-50">Convention compteurs</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Carte GPS */}
              {position && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                    Position GPS
                  </p>
                  <div className="rounded-xl overflow-hidden">
                    <MapContainer
                      center={[position.lat, position.lng]}
                      zoom={15}
                      style={{ height: "180px", width: "100%" }}
                      dragging={false}
                      scrollWheelZoom={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[position.lat, position.lng]} />
                    </MapContainer>
                  </div>
                </div>
              )}

              {/* Motif refus */}
              {demandeSelectionnee.statut === "refusee" &&
                demandeSelectionnee.motif_refus && (
                  <div className="bg-red-50 dark:bg-red-900 rounded-xl p-4 border-l-4 border-red-500">
                    <p className="text-xs font-semibold text-red-400 mb-1">
                      Motif du refus
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {demandeSelectionnee.motif_refus}
                    </p>
                  </div>
                )}

              {/* Info compte créé */}
              {demandeSelectionnee.statut === "acceptee" && (
                <div className="bg-green-50 dark:bg-green-900 rounded-xl p-4 border-l-4 border-green-500">
                  <div className="flex items-center gap-2">
                    <MdCheckCircle className="text-green-500 text-xl" />
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                      Demande acceptée - Compte client créé
                    </p>
                  </div>
                  {demandeSelectionnee.date_traitement && (
                    <p className="text-xs text-green-500 mt-1">
                      Traitée le{" "}
                      {new Date(
                        demandeSelectionnee.date_traitement
                      ).toLocaleString("fr-FR")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Boutons */}
            {demandeSelectionnee.statut === "en_attente" ? (
              <div className="flex gap-3 p-6 border-t dark:border-gray-700 flex-shrink-0">
                <button
                  onClick={() => setShowDetail(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setShowDetail(false);
                    setShowRefus(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium"
                >
                  <MdCancel />
                  Refuser
                </button>
                <button
                  onClick={() => handleAccepter(demandeSelectionnee)}
                  disabled={loadingAction}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition font-medium disabled:opacity-50"
                >
                  {loadingAction ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <MdCheckCircle />
                  )}
                  Accepter et créer compte
                </button>
              </div>
            ) : (
              <div className="p-6 border-t dark:border-gray-700 flex-shrink-0">
                <button
                  onClick={() => setShowDetail(false)}
                  className="w-full py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MODAL REFUS ===== */}
      {showRefus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Refuser la demande
              </h3>
              <button onClick={() => setShowRefus(false)}>
                <MdClose className="text-gray-400 text-2xl" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900 rounded-xl p-3">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Demande de {demandeSelectionnee?.prenom}{" "}
                  {demandeSelectionnee?.nom}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motif du refus *
                </label>
                <textarea
                  value={motifRefus}
                  onChange={e => setMotifRefus(e.target.value)}
                  placeholder="Ex: Documents incomplets, zone non couverte..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRefus(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRefuser}
                  disabled={!motifRefus.trim() || loadingAction}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition disabled:opacity-50"
                >
                  {loadingAction ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <MdCancel />
                  )}
                  Confirmer le refus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL SUCCES ===== */}
      {showSucces && compteCreer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <MdCheckCircle className="text-green-500 text-4xl" />
              </div>

              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Compte créé avec succès !
              </h3>

              <p className="text-sm text-gray-500">
                Les identifiants temporaires du client sont :
              </p>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-left space-y-3">
                <div>
                  <p className="text-xs text-gray-400">Nom d'utilisateur</p>
                  <p className="font-bold text-primary-600 text-lg">
                    {compteCreer.username}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">
                    Mot de passe temporaire
                  </p>
                  <p className="font-bold text-primary-600 text-lg font-mono">
                    {compteCreer.password_temporaire}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {compteCreer.email}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900 rounded-xl p-3">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Communiquez ces identifiants au client. Il pourra les modifier
                  dans son profil.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowSucces(false);
                  setCompteCreer(null);
                }}
                className="w-full py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition font-medium"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
