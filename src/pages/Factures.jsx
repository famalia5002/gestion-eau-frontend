import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { factureService } from "../services/api";
import { genererFacturePDF } from "../utils/generatePDF";
import logo from "../assets/logo.jpg";
import {
  MdReceipt,
  MdSearch,
  MdVisibility,
  MdCheckCircle,
  MdWarning,
  MdAccessTime,
  MdCalendarToday,
  MdPayment,
  MdClose,
  MdPerson,
  MdWater,
  MdLocationOn,
  MdPictureAsPdf,
} from "react-icons/md";

const STATUTS = {
  en_attente: {
    label: "En attente",
    color: "bg-yellow-50 text-yellow-700",
    icon: MdAccessTime,
  },
  payee: {
    label: "Payée",
    color: "bg-green-50 text-green-700",
    icon: MdCheckCircle,
  },
  en_retard: {
    label: "En retard",
    color: "bg-red-50 text-red-700",
    icon: MdWarning,
  },
};
const handleTelechargerPDF = facture => {
  genererFacturePDF(facture);
};
const MODES_PAIEMENT = [
  { value: "wave", label: "Wave" },
  { value: "orange_money", label: "Orange Money" },
  { value: "agence", label: "Agence" },
];

export default function Factures() {
  const { user } = useAuth();
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [showDetail, setShowDetail] = useState(false);
  const [showPaiement, setShowPaiement] = useState(false);
  const [factureSelectionnee, setFactureSelectionnee] = useState(null);
  const [modePaiement, setModePaiement] = useState("wave");
  const [message, setMessage] = useState({ type: "", texte: "" });
  const [loadingPaiement, setLoadingPaiement] = useState(false);

  useEffect(() => {
    fetchFactures();
  }, []);

  const fetchFactures = async () => {
    try {
      const response = await factureService.getAll();
      setFactures(response.data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer factures
  const facturesFiltrees = factures.filter(f => {
    const matchRecherche =
      f.client_detail?.first_name
        ?.toLowerCase()
        .includes(recherche.toLowerCase()) ||
      f.client_detail?.last_name
        ?.toLowerCase()
        .includes(recherche.toLowerCase()) ||
      f.id?.toString().includes(recherche);

    const matchStatut = filtreStatut === "tous" || f.statut === filtreStatut;
    return matchRecherche && matchStatut;
  });

  // Stats factures
  const stats = {
    total: factures.length,
    en_attente: factures.filter(f => f.statut === "en_attente").length,
    payee: factures.filter(f => f.statut === "payee").length,
    en_retard: factures.filter(f => f.statut === "en_retard").length,
    montant_total: factures.reduce((sum, f) => sum + f.montant, 0).toFixed(0),
  };

  // Payer une facture
  const handlePayer = async () => {
    if (!factureSelectionnee) return;
    setLoadingPaiement(true);
    try {
      await factureService.payer(factureSelectionnee.id, modePaiement);
      setMessage({
        type: "success",
        texte: "Paiement enregistré avec succès !",
      });
      setShowPaiement(false);
      fetchFactures();
    } catch (error) {
      setMessage({ type: "error", texte: "Erreur lors du paiement." });
    } finally {
      setLoadingPaiement(false);
      setTimeout(() => setMessage({ type: "", texte: "" }), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Message */}
      {message.texte && (
        <div
          className={`p-4 rounded-xl text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <MdCheckCircle className="inline mr-2" />
          ) : (
            <MdWarning className="inline mr-2" />
          )}
          {message.texte}
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Gestion des Factures
          </h3>
          <p className="text-sm text-gray-500">
            {factures.length} facture(s) au total
          </p>
        </div>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-3 rounded-xl">
              <MdReceipt className="text-blue-600 text-xl" />
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
              <MdAccessTime className="text-yellow-600 text-xl" />
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
              <p className="text-xs text-gray-500">Payées</p>
              <p className="text-xl font-bold text-green-600">{stats.payee}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-3 rounded-xl">
              <MdWarning className="text-red-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En retard</p>
              <p className="text-xl font-bold text-red-600">
                {stats.en_retard}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        {/* Statut */}
        <div className="flex bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setFiltreStatut("tous")}
            className={`px-4 py-2 text-sm font-medium transition ${
              filtreStatut === "tous"
                ? "bg-primary-500 text-white"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Tous
          </button>
          {Object.entries(STATUTS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setFiltreStatut(key)}
              className={`px-4 py-2 text-sm font-medium transition ${
                filtreStatut === key
                  ? "bg-primary-500 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>

        {/* Recherche */}
        <div className="relative flex-1 min-w-48">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Rechercher par client ou numéro..."
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
        ) : facturesFiltrees.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MdReceipt className="text-5xl mx-auto mb-2 opacity-30" />
            <p>Aucune facture trouvée</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {[
                  "N°",
                  "Client",
                  "Volume",
                  "Montant",
                  "Statut",
                  "Date limite",
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
              {facturesFiltrees.map(facture => {
                const statut = STATUTS[facture.statut];
                const StatutIcon = statut?.icon || MdAccessTime;
                return (
                  <tr
                    key={facture.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {/* Numéro */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                          <MdReceipt className="text-primary-600 text-sm" />
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-white text-sm">
                          #{facture.id}
                        </span>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-6 py-4">
                      {facture.client_detail ? (
                        <div className="flex items-center gap-2">
                          {facture.client_detail.photo_url ? (
                            <img
                              src={facture.client_detail.photo_url}
                              alt="Photo"
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <MdPerson className="text-primary-600 text-sm" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {facture.client_detail.first_name}{" "}
                              {facture.client_detail.last_name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {facture.client_detail.zone}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>

                    {/* Volume */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <MdWater className="text-blue-400 text-sm" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {facture.volume_total} L
                        </span>
                      </div>
                    </td>

                    {/* Montant */}
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-800 dark:text-white">
                        {facture.montant?.toLocaleString("fr-FR")} FCFA
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${statut?.color}`}
                      >
                        <StatutIcon className="text-sm" />
                        {statut?.label}
                      </span>
                    </td>

                    {/* Date limite */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <MdCalendarToday className="text-gray-400 text-sm" />
                        {new Date(facture.date_limite).toLocaleDateString(
                          "fr-FR"
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Voir détails */}
                        <button
                          onClick={() => {
                            setFactureSelectionnee(facture);
                            setShowDetail(true);
                          }}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                          title="Voir détails"
                        >
                          <MdVisibility />
                        </button>
                        {/* Télécharger PDF */}
                        <button
                          onClick={() => handleTelechargerPDF(facture)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                          title="Télécharger PDF"
                        >
                          <MdPictureAsPdf />
                        </button>

                        {/* Payer - seulement si pas payée */}
                        {facture.statut !== "payee" && (
                          <button
                            onClick={() => {
                              setFactureSelectionnee(facture);
                              setModePaiement("wave");
                              setShowPaiement(true);
                            }}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                            title="Enregistrer paiement"
                          >
                            <MdPayment />
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
      {showDetail && factureSelectionnee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Facture #{factureSelectionnee.id}
              </h3>
              <button onClick={() => setShowDetail(false)}>
                <MdClose className="text-gray-400 text-2xl hover:text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Statut */}
              <div className="flex justify-center">
                {(() => {
                  const statut = STATUTS[factureSelectionnee.statut];
                  const StatutIcon = statut?.icon || MdAccessTime;
                  return (
                    <span
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${statut?.color}`}
                    >
                      <StatutIcon className="text-lg" />
                      {statut?.label}
                    </span>
                  );
                })()}
              </div>

              {/* Infos client */}
              {factureSelectionnee.client_detail && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-2">Client</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <MdPerson className="text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {factureSelectionnee.client_detail.first_name}{" "}
                        {factureSelectionnee.client_detail.last_name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MdLocationOn className="text-primary-400" />
                        {factureSelectionnee.client_detail.zone || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Détails facture */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Volume consommé</p>
                  <div className="flex items-center gap-1">
                    <MdWater className="text-blue-500" />
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {factureSelectionnee.volume_total} L
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Montant</p>
                  <p className="font-bold text-lg text-gray-800 dark:text-white">
                    {factureSelectionnee.montant?.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Date génération</p>
                  <div className="flex items-center gap-1">
                    <MdCalendarToday className="text-gray-400 text-sm" />
                    <p className="text-sm text-gray-800 dark:text-white">
                      {new Date(
                        factureSelectionnee.date_generation
                      ).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Date limite</p>
                  <div className="flex items-center gap-1">
                    <MdCalendarToday className="text-red-400 text-sm" />
                    <p className="text-sm text-gray-800 dark:text-white">
                      {new Date(
                        factureSelectionnee.date_limite
                      ).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mode paiement si payée */}
              {factureSelectionnee.statut === "payee" &&
                factureSelectionnee.mode_paiement && (
                  <div className="bg-green-50 dark:bg-green-900 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">
                      Mode de paiement
                    </p>
                    <div className="flex items-center gap-2">
                      <MdPayment className="text-green-600" />
                      <p className="font-medium text-green-700 dark:text-green-300 capitalize">
                        {factureSelectionnee.mode_paiement.replace("_", " ")}
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
              {/* Bouton PDF */}
              <button
                onClick={() => handleTelechargerPDF(factureSelectionnee)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
              >
                <MdPictureAsPdf />
                PDF
              </button>
              {factureSelectionnee.statut !== "payee" && (
                <button
                  onClick={() => {
                    setShowDetail(false);
                    setModePaiement("wave");
                    setShowPaiement(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition"
                >
                  <MdPayment />
                  Enregistrer paiement
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL PAIEMENT ===== */}
      {showPaiement && factureSelectionnee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Enregistrer un paiement
              </h3>
              <button onClick={() => setShowPaiement(false)}>
                <MdClose className="text-gray-400 text-2xl hover:text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Info facture */}
              <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-blue-400 mb-1">
                      Facture #{factureSelectionnee.id}
                    </p>
                    <p className="font-semibold text-blue-800 dark:text-blue-200">
                      {factureSelectionnee.client_detail?.first_name}{" "}
                      {factureSelectionnee.client_detail?.last_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-400 mb-1">Montant</p>
                    <p className="font-bold text-xl text-blue-800 dark:text-blue-200">
                      {factureSelectionnee.montant?.toLocaleString("fr-FR")}{" "}
                      FCFA
                    </p>
                  </div>
                </div>
              </div>

              {/* Mode paiement */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Choisir le mode de paiement
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {MODES_PAIEMENT.map(mode => (
                    <button
                      key={mode.value}
                      onClick={() => setModePaiement(mode.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition ${
                        modePaiement === mode.value
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900"
                          : "border-gray-200 dark:border-gray-600 hover:border-primary-300"
                      }`}
                    >
                      <MdPayment
                        className={`text-2xl ${
                          modePaiement === mode.value
                            ? "text-primary-600"
                            : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          modePaiement === mode.value
                            ? "text-primary-700 dark:text-primary-300"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {mode.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPaiement(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handlePayer}
                  disabled={loadingPaiement}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition disabled:opacity-50"
                >
                  {loadingPaiement ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <MdCheckCircle className="text-lg" />
                  )}
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
