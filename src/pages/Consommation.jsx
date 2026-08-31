import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  consommationService,
  compteurService,
  factureService,
} from "../services/api";

import {
  MdShowChart,
  MdWater,
  MdSearch,
  MdCalendarToday,
  MdRefresh,
  MdArrowUpward,
  MdArrowDownward,
  MdReceipt,
  MdCheckCircle,
  MdWarning,
  MdPeople,
  MdAdd,
  MdClose,
} from "react-icons/md";
import {
  AreaChart,
  BarChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
} from "recharts";
import { genererEtEnvoyerPDF, envoyerPDFParEmail } from "../utils/generatePDF";

const PERIODES = [
  { value: "journalier", label: "Aujourd'hui" },
  { value: "mensuel", label: "Ce mois" },
  { value: "annuel", label: "Cette année" },
];

// Tooltip personnalisé
function TooltipPerso({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 border border-gray-100 dark:border-gray-700">
        <p className="font-semibold text-gray-700 dark:text-white text-sm mb-1">
          {label}
        </p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
            {p.value} litres
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function Consommation() {
  const { user } = useAuth();
  const [consommations, setConsommations] = useState([]);
  const [compteurs, setCompteurs] = useState([]);
  const [index, setIndex] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState("journalier");
  const [compteurChoisi, setCompteurChoisi] = useState("");
  const [showIndex, setShowIndex] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [consommationsGroupees, setConsommationsGroupees] = useState([]);
  const [showModalFacture, setShowModalFacture] = useState(false);
  const [clientFacture, setClientFacture] = useState(null);
  const [loadingFacture, setLoadingFacture] = useState(false);
  const [messageFacture, setMessageFacture] = useState({ type: "", texte: "" });

  useEffect(() => {
    fetchCompteurs();
  }, []);

  useEffect(() => {
    fetchConsommations();
  }, [periode]);
  // Grouper consommations par client
  useEffect(() => {
    const groupes = {};
    consommations.forEach(c => {
      const clientId = c.compteur_detail?.client_detail?.id;
      if (!clientId) return;

      if (!groupes[clientId]) {
        groupes[clientId] = {
          client: c.compteur_detail.client_detail,
          compteur: c.compteur_detail,
          volume_total: 0,
          nb_releves: 0,
        };
      }
      groupes[clientId].volume_total += c.volume;
      groupes[clientId].nb_releves += 1;
    });
    setConsommationsGroupees(Object.values(groupes));
  }, [consommations]);

  const fetchCompteurs = async () => {
    try {
      const response = await compteurService.getAll();
      setCompteurs(response.data);
    } catch (error) {
      console.error("Erreur compteurs:", error);
    }
  };
  const handleGenererFacture = async clientId => {
    setLoadingFacture(true);
    try {
      const response = await factureService.generer(clientId);
      const facture = response.data.facture;

      // Générer PDF + envoyer par email automatiquement
      await genererEtEnvoyerPDF(facture);

      setMessageFacture({
        type: "success",
        texte: `Facture générée et envoyée par email au client !`,
      });
      setShowModalFacture(false);
    } catch (error) {
      setMessageFacture({
        type: "error",
        texte: error.response?.data?.erreur || "Erreur lors de la génération.",
      });
    } finally {
      setLoadingFacture(false);
      setTimeout(() => setMessageFacture({ type: "", texte: "" }), 4000);
    }
  };
  const handleGenererToutes = async () => {
    if (!confirm("Générer les factures pour tous les clients ?")) return;
    setLoadingFacture(true);
    try {
      const response = await factureService.genererToutes();

      // Envoyer PDF par email pour chaque facture (sans ouvrir d'onglet)
      if (response.data.factures_data) {
        for (const factureData of response.data.factures_data) {
          await envoyerPDFParEmail(factureData);
        }
      }

      setMessageFacture({
        type: "success",
        texte: `${response.data.message} - PDFs envoyés par email aux clients !`,
      });
    } catch (error) {
      setMessageFacture({
        type: "error",
        texte: "Erreur lors de la génération.",
      });
    } finally {
      setLoadingFacture(false);
      setTimeout(() => setMessageFacture({ type: "", texte: "" }), 4000);
    }
  };

  const fetchConsommations = async () => {
    setLoading(true);
    try {
      const response = await consommationService.getAll(periode);
      setConsommations(response.data);
    } catch (error) {
      console.error("Erreur consommations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIndex = async compteurId => {
    try {
      const response = await consommationService.getIndex(compteurId);
      setIndex(response.data);
      setShowIndex(true);
    } catch (error) {
      console.error("Erreur index:", error);
    }
  };

  // Filtrer consommations
  const consommationsFiltrees = consommations.filter(
    c =>
      c.compteur_detail?.numero_compteur
        ?.toLowerCase()
        .includes(recherche.toLowerCase()) ||
      c.compteur_detail?.client_detail?.first_name
        ?.toLowerCase()
        .includes(recherche.toLowerCase()) ||
      c.compteur_detail?.client_detail?.last_name
        ?.toLowerCase()
        .includes(recherche.toLowerCase())
  );

  // Total volume
  const totalVolume = consommationsFiltrees
    .reduce((sum, c) => sum + c.volume, 0)
    .toFixed(2);

  // Données graphique
  const donneesGraphique = () => {
    if (!consommations || consommations.length === 0) return [];
    try {
      if (periode === "journalier") {
        const parHeure = {};
        consommations.forEach(c => {
          const heure = new Date(c.date_heure).getHours();
          const label = `${heure}h`;
          parHeure[label] = (parHeure[label] || 0) + c.volume;
        });
        return Object.entries(parHeure)
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .map(([h, v]) => ({ date: h, volume: parseFloat(v.toFixed(2)) }));
      }
      if (periode === "mensuel") {
        const parJour = {};
        consommations.forEach(c => {
          const jour = new Date(c.date_heure).getDate();
          parJour[jour] = (parJour[jour] || 0) + c.volume;
        });
        return Object.entries(parJour)
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .map(([j, v]) => ({
            date: `Jour ${j}`,
            volume: parseFloat(v.toFixed(2)),
          }));
      }
      if (periode === "annuel") {
        const moisFr = [
          "Jan",
          "Fév",
          "Mar",
          "Avr",
          "Mai",
          "Jun",
          "Jul",
          "Aoû",
          "Sep",
          "Oct",
          "Nov",
          "Déc",
        ];
        const parMois = {};
        consommations.forEach(c => {
          const mois = moisFr[new Date(c.date_heure).getMonth()];
          parMois[mois] = (parMois[mois] || 0) + c.volume;
        });
        return moisFr
          .filter(m => parMois[m] > 0)
          .map(m => ({ date: m, volume: parseFloat(parMois[m].toFixed(2)) }));
      }
    } catch (error) {
      console.error("Erreur graphique:", error);
      return [];
    }
    return [];
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Suivi de Consommation
          </h3>
          <p className="text-sm text-gray-500">
            {consommations.length} relevé(s) trouvé(s)
          </p>
        </div>
        <button
          onClick={fetchConsommations}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl transition"
        >
          <MdRefresh className="text-xl" />
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        {/* Période */}
        <div className="flex bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {PERIODES.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriode(p.value)}
              className={`px-4 py-2 text-sm font-medium transition ${
                periode === p.value
                  ? "bg-primary-500 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

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

      {/* Cartes résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-3 rounded-xl">
              <MdWater className="text-blue-600 text-2xl" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Volume total</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {totalVolume}
                <span className="text-sm font-normal text-gray-400 ml-1">
                  L
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-3 rounded-xl">
              <MdShowChart className="text-green-600 text-2xl" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Nombre de relevés</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {consommationsFiltrees.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 p-3 rounded-xl">
              <MdCalendarToday className="text-purple-600 text-2xl" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Moyenne par relevé</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {consommationsFiltrees.length > 0
                  ? (totalVolume / consommationsFiltrees.length).toFixed(2)
                  : 0}
                <span className="text-sm font-normal text-gray-400 ml-1">
                  L
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message facture */}
      {messageFacture.texte && (
        <div
          className={`p-4 rounded-xl text-sm font-medium ${
            messageFacture.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {messageFacture.type === "success" ? (
            <MdCheckCircle className="inline mr-2" />
          ) : (
            <MdWarning className="inline mr-2" />
          )}
          {messageFacture.texte}
        </div>
      )}

      {/* Tableau groupé par client */}
      {consommationsGroupees.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white">
                Consommation par client
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                Cliquez sur "Générer" pour créer la facture du client
              </p>
            </div>
            {/* Bouton tout générer */}
            <button
              onClick={handleGenererToutes}
              disabled={loadingFacture}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl transition text-sm font-medium disabled:opacity-50"
            >
              <MdReceipt className="text-lg" />
              Tout générer
            </button>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {[
                  "Client",
                  "Compteur",
                  "Volume total",
                  "Nb relevés",
                  "Action",
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
              {consommationsGroupees.map(groupe => (
                <tr
                  key={groupe.client.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  {/* Client */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {groupe.client.photo_url ? (
                        <img
                          src={groupe.client.photo_url}
                          alt="Photo"
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 text-sm font-bold">
                            {groupe.client.first_name?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white text-sm">
                          {groupe.client.first_name} {groupe.client.last_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {groupe.client.zone}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Compteur */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MdWater className="text-blue-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {groupe.compteur.numero_compteur}
                      </span>
                    </div>
                  </td>

                  {/* Volume total */}
                  <td className="px-6 py-4">
                    <span
                      className={`font-bold text-sm ${
                        groupe.volume_total > 500
                          ? "text-red-600"
                          : groupe.volume_total > 200
                            ? "text-orange-500"
                            : "text-green-600"
                      }`}
                    >
                      {groupe.volume_total.toFixed(2)} L
                    </span>
                  </td>

                  {/* Nb relevés */}
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      {groupe.nb_releves} relevé(s)
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        setClientFacture(groupe.client);
                        setShowModalFacture(true);
                      }}
                      className="flex items-center gap-1 px-3 py-2 bg-primary-50 text-primary-700 rounded-xl hover:bg-primary-100 transition text-sm font-medium"
                    >
                      <MdReceipt className="text-base" />
                      Générer facture
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Graphique */}
      {(() => {
        const data = donneesGraphique();
        if (!data || data.length === 0) return null;
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm mb-4">
            <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
              {periode === "journalier"
                ? "Consommation par heure"
                : periode === "mensuel"
                  ? "Consommation par jour du mois"
                  : "Consommation par mois"}
            </h4>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {user?.role === "super_admin"
                ? "Toutes les zones"
                : `Zone : ${user?.zone}`}
            </span>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" L" />
                <Tooltip
                  formatter={value => [`${value} L`, "Volume consommé"]}
                  labelFormatter={label => {
                    if (periode === "journalier") return `Heure : ${label}`;
                    if (periode === "mensuel") return `Jour ${label}`;
                    return `Mois : ${label}`;
                  }}
                  cursor={{ fill: "#EFF6FF" }}
                />
                <Bar
                  dataKey="volume"
                  fill="#2E75B6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
            {/* Légende */}
            <p className="text-xs text-gray-400 text-center mt-2">
              Volume total : {totalVolume} L • {consommationsFiltrees.length}{" "}
              relevé(s)
            </p>
          </div>
        );
      })()}

      {/* Historique index par compteur */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h4 className="font-bold text-gray-800 dark:text-white mb-4">
          Historique des index par compteur
        </h4>
        <div className="flex gap-3">
          <select
            value={compteurChoisi}
            onChange={e => setCompteurChoisi(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Sélectionner un compteur...</option>
            {compteurs.map(c => (
              <option key={c.id} value={c.id}>
                {c.numero_compteur}
                {c.client_detail
                  ? ` - ${c.client_detail.first_name} ${c.client_detail.last_name}`
                  : " (non attribué)"}
              </option>
            ))}
          </select>
          <button
            onClick={() => compteurChoisi && fetchIndex(compteurChoisi)}
            disabled={!compteurChoisi}
            className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition disabled:opacity-50"
          >
            Voir index
          </button>
        </div>

        {/* Liste index */}
        {showIndex && index.length > 0 && (
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {index.map((idx, i) => (
              <div
                key={idx.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-600 text-xs font-bold">
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      {idx.valeur_index} m³
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(idx.date_releve).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
                {i > 0 && (
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      idx.valeur_index > index[i - 1].valeur_index
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {idx.valeur_index > index[i - 1].valeur_index ? (
                      <MdArrowUpward />
                    ) : (
                      <MdArrowDownward />
                    )}
                    {Math.abs(
                      idx.valeur_index - index[i - 1].valeur_index
                    ).toFixed(3)}{" "}
                    m³
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showIndex && index.length === 0 && (
          <div className="mt-4 text-center py-6 text-gray-400">
            <MdShowChart className="text-4xl mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun index disponible</p>
          </div>
        )}
      </div>

      {/* Tableau relevés */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b dark:border-gray-700">
          <h4 className="font-bold text-gray-800 dark:text-white">
            Relevés de consommation
          </h4>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        ) : consommationsFiltrees.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MdShowChart className="text-5xl mx-auto mb-2 opacity-30" />
            <p>Aucun relevé trouvé</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {["Compteur", "Client", "Volume", "Date et heure"].map(h => (
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
              {consommationsFiltrees.map(c => (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <MdWater className="text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-800 dark:text-white text-sm">
                        {c.compteur_detail?.numero_compteur || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {c.compteur_detail?.client_detail ? (
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          {c.compteur_detail.client_detail.first_name}{" "}
                          {c.compteur_detail.client_detail.last_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {c.compteur_detail.client_detail.zone}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        Non attribué
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`font-bold text-sm ${
                        c.volume > 100
                          ? "text-red-600"
                          : c.volume > 50
                            ? "text-orange-500"
                            : "text-green-600"
                      }`}
                    >
                      {c.volume} L
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <MdCalendarToday className="text-gray-400" />
                      {new Date(c.date_heure).toLocaleString("fr-FR")}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* ===== MODAL CONFIRMATION FACTURE ===== */}
      {showModalFacture && clientFacture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Confirmer la génération
              </h3>
              <button onClick={() => setShowModalFacture(false)}>
                <MdClose className="text-gray-400 text-2xl hover:text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Info client */}
              <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  {clientFacture.photo_url ? (
                    <img
                      src={clientFacture.photo_url}
                      alt="Photo"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 text-lg font-bold">
                        {clientFacture.first_name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-blue-800 dark:text-blue-200">
                      {clientFacture.first_name} {clientFacture.last_name}
                    </p>
                    <p className="text-xs text-blue-500">
                      Zone : {clientFacture.zone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Volume du client */}
              {(() => {
                const groupe = consommationsGroupees.find(
                  g => g.client.id === clientFacture.id
                );
                return groupe ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400 mb-1">Volume total</p>
                      <p className="font-bold text-gray-800 dark:text-white">
                        {groupe.volume_total.toFixed(2)} L
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400 mb-1">
                        Nombre de relevés
                      </p>
                      <p className="font-bold text-gray-800 dark:text-white">
                        {groupe.nb_releves}
                      </p>
                    </div>
                  </div>
                ) : null;
              })()}

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Le montant sera calculé automatiquement selon le tarif en
                vigueur.
              </p>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModalFacture(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleGenererFacture(clientFacture.id)}
                  disabled={loadingFacture}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition disabled:opacity-50"
                >
                  {loadingFacture ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <MdReceipt className="text-lg" />
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
