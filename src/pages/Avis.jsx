import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { avisService } from "../services/api";
import {
  MdStar,
  MdStarBorder,
  MdSearch,
  MdVisibility,
  MdDelete,
  MdClose,
  MdPerson,
  MdLocationOn,
  MdCalendarToday,
  MdCheckCircle,
  MdError,
} from "react-icons/md";

// Composant étoiles
function Etoiles({ note, size = "text-lg" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i =>
        i <= note ? (
          <MdStar key={i} className={`${size} text-yellow-400`} />
        ) : (
          <MdStarBorder key={i} className={`${size} text-gray-300`} />
        )
      )}
    </div>
  );
}

const STATUTS = {
  en_attente: {
    label: "En attente",
    color: "bg-yellow-50 text-yellow-700",
  },
  traite: {
    label: "Traité",
    color: "bg-green-50 text-green-700",
  },
};

export default function Avis() {
  const { user } = useAuth();
  const [avisList, setAvisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreNote, setFiltreNote] = useState("toutes");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [showDetail, setShowDetail] = useState(false);
  const [avisSelectionne, setAvisSelectionne] = useState(null);
  const [message, setMessage] = useState({ type: "", texte: "" });
  const [reponse, setReponse] = useState("");
  const [loadingReponse, setLoadingReponse] = useState(false);

  useEffect(() => {
    fetchAvis();
  }, []);

  const fetchAvis = async () => {
    try {
      const response = await avisService.getAll();
      setAvisList(response.data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer avis
  const avisFiltres = avisList.filter(a => {
    const matchRecherche =
      a.client_detail?.first_name
        ?.toLowerCase()
        .includes(recherche.toLowerCase()) ||
      a.client_detail?.last_name
        ?.toLowerCase()
        .includes(recherche.toLowerCase()) ||
      a.commentaire?.toLowerCase().includes(recherche.toLowerCase());

    const matchNote =
      filtreNote === "toutes" || a.note === parseInt(filtreNote);
    const matchStatut = filtreStatut === "tous" || a.statut === filtreStatut;

    return matchRecherche && matchNote && matchStatut;
  });
  const handleRepondre = async () => {
    if (!reponse.trim()) return;
    setLoadingReponse(true);
    try {
      await avisService.repondre(avisSelectionne.id, reponse);
      setMessage({ type: "success", texte: "Réponse envoyée avec succès !" });
      setReponse("");
      setShowDetail(false);
      fetchAvis();
    } catch (error) {
      setMessage({ type: "error", texte: "Erreur lors de l'envoi." });
    } finally {
      setLoadingReponse(false);
      setTimeout(() => setMessage({ type: "", texte: "" }), 3000);
    }
  };

  const handleTraiter = async id => {
    try {
      await avisService.traiter(id);
      setMessage({ type: "success", texte: "Avis marqué comme traité !" });
      setShowDetail(false);
      fetchAvis();
    } catch (error) {
      setMessage({ type: "error", texte: "Erreur." });
    }
    setTimeout(() => setMessage({ type: "", texte: "" }), 3000);
  };

  // Stats
  const stats = {
    total: avisList.length,
    moyenne:
      avisList.length > 0
        ? (
            avisList.reduce((sum, a) => sum + a.note, 0) / avisList.length
          ).toFixed(1)
        : 0,
    cinq_etoiles: avisList.filter(a => a.note === 5).length,
    en_attente: avisList.filter(a => a.statut === "en_attente").length,
  };

  // Supprimer un avis
  const handleSupprimer = async id => {
    if (!confirm("Voulez-vous vraiment supprimer cet avis ?")) return;
    try {
      await avisService.delete(id);
      setMessage({ type: "success", texte: "Avis supprimé avec succès !" });
      setShowDetail(false);
      fetchAvis();
    } catch (error) {
      setMessage({ type: "error", texte: "Erreur lors de la suppression." });
    }
    setTimeout(() => setMessage({ type: "", texte: "" }), 3000);
  };

  // Couleur selon la note
  const getCouleurNote = note => {
    if (note >= 4) return "text-green-600";
    if (note >= 3) return "text-yellow-600";
    return "text-red-600";
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
            Avis des Clients
          </h3>
          <p className="text-sm text-gray-500">
            {avisList.length} avis au total
          </p>
        </div>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-3 rounded-xl">
              <MdStar className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total avis</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        {/* Moyenne */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-50 p-3 rounded-xl">
              <MdStar className="text-yellow-500 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Note moyenne</p>
              <div className="flex items-center gap-1">
                <p className="text-xl font-bold text-yellow-500">
                  {stats.moyenne}
                </p>
                <p className="text-xs text-gray-400">/5</p>
              </div>
            </div>
          </div>
        </div>

        {/* 5 étoiles */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-3 rounded-xl">
              <MdStar className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">5 étoiles</p>
              <p className="text-xl font-bold text-green-600">
                {stats.cinq_etoiles}
              </p>
            </div>
          </div>
        </div>

        {/* En attente */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 p-3 rounded-xl">
              <MdStar className="text-orange-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En attente</p>
              <p className="text-xl font-bold text-orange-600">
                {stats.en_attente}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barre note moyenne visuelle */}
      {avisList.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-yellow-500">
                {stats.moyenne}
              </p>
              <Etoiles note={Math.round(stats.moyenne)} size="text-2xl" />
              <p className="text-xs text-gray-400 mt-1">{stats.total} avis</p>
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map(note => {
                const count = avisList.filter(a => a.note === note).length;
                const pct =
                  avisList.length > 0
                    ? Math.round((count / avisList.length) * 100)
                    : 0;
                return (
                  <div key={note} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-xs text-gray-500">{note}</span>
                      <MdStar className="text-yellow-400 text-sm" />
                    </div>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        {/* Filtre statut */}
        <div className="flex bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {["tous", "en_attente", "traite"].map(s => (
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
                  : "Traités"}
            </button>
          ))}
        </div>

        {/* Filtre note */}
        <select
          value={filtreNote}
          onChange={e => setFiltreNote(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
        >
          <option value="toutes">Toutes les notes</option>
          {[5, 4, 3, 2, 1].map(n => (
            <option key={n} value={n}>
              {n} étoile{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>

        {/* Recherche */}
        <div className="relative flex-1 min-w-48">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Rechercher par client ou commentaire..."
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
        ) : avisFiltres.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MdStar className="text-5xl mx-auto mb-2 opacity-30" />
            <p>Aucun avis trouvé</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {[
                  "Client",
                  "Note",
                  "Commentaire",
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
              {avisFiltres.map(avis => (
                <tr
                  key={avis.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  {/* Client */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {avis.client_detail?.photo_url ? (
                        <img
                          src={avis.client_detail.photo_url}
                          alt="Photo"
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 text-sm font-bold">
                            {avis.client_detail?.first_name?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          {avis.client_detail?.first_name}{" "}
                          {avis.client_detail?.last_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {avis.client_detail?.zone}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Note */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <Etoiles note={avis.note} />
                      <span
                        className={`text-xs font-bold ${getCouleurNote(avis.note)}`}
                      >
                        {avis.note}/5
                      </span>
                    </div>
                  </td>

                  {/* Commentaire */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 max-w-48 truncate">
                      {avis.commentaire}
                    </p>
                  </td>

                  {/* Statut */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUTS[avis.statut]?.color
                      }`}
                    >
                      {STATUTS[avis.statut]?.label}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      <MdCalendarToday className="text-gray-400 text-sm" />
                      {new Date(avis.date_avis).toLocaleDateString("fr-FR")}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setAvisSelectionne(avis);
                          setShowDetail(true);
                        }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                        title="Voir détails"
                      >
                        <MdVisibility />
                      </button>
                      <button
                        onClick={() => handleSupprimer(avis.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                        title="Supprimer"
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== MODAL DETAIL ===== */}
      {showDetail && avisSelectionne && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Détails de l'avis
              </h3>
              <button onClick={() => setShowDetail(false)}>
                <MdClose className="text-gray-400 text-2xl hover:text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Note */}
              <div className="flex flex-col items-center gap-2 py-4">
                <Etoiles note={avisSelectionne.note} size="text-4xl" />
                <p
                  className={`text-2xl font-bold ${getCouleurNote(avisSelectionne.note)}`}
                >
                  {avisSelectionne.note} / 5
                </p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    STATUTS[avisSelectionne.statut]?.color
                  }`}
                >
                  {STATUTS[avisSelectionne.statut]?.label}
                </span>
              </div>

              {/* Client */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2">Client</p>
                <div className="flex items-center gap-3">
                  {avisSelectionne.client_detail?.photo_url ? (
                    <img
                      src={avisSelectionne.client_detail.photo_url}
                      alt="Photo"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <MdPerson className="text-primary-600 text-xl" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {avisSelectionne.client_detail?.first_name}{" "}
                      {avisSelectionne.client_detail?.last_name}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <MdLocationOn className="text-primary-400" />
                      {avisSelectionne.client_detail?.zone || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Commentaire */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2">Commentaire</p>
                <p className="text-sm text-gray-800 dark:text-white leading-relaxed">
                  {avisSelectionne.commentaire}
                </p>
              </div>
              {/* Réponse existante de l'admin */}
              {avisSelectionne.reponse_admin && (
                <div className="bg-primary-50 dark:bg-primary-900 rounded-xl p-4 border-l-4 border-primary-500">
                  <p className="text-xs text-primary-400 mb-1">
                    Réponse de l'administration
                  </p>
                  <p className="text-sm text-primary-800 dark:text-primary-200">
                    {avisSelectionne.reponse_admin}
                  </p>
                  {avisSelectionne.date_reponse && (
                    <p className="text-xs text-primary-400 mt-2">
                      {new Date(avisSelectionne.date_reponse).toLocaleString(
                        "fr-FR"
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* Formulaire de réponse */}
              {avisSelectionne.statut === "en_attente" && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Répondre à cet avis
                  </p>
                  <textarea
                    value={reponse}
                    onChange={e => setReponse(e.target.value)}
                    placeholder="Écrivez votre réponse..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                </div>
              )}

              {/* Date */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Date de l'avis</p>
                <div className="flex items-center gap-2">
                  <MdCalendarToday className="text-gray-400" />
                  <p className="text-sm text-gray-800 dark:text-white">
                    {new Date(avisSelectionne.date_avis).toLocaleString(
                      "fr-FR"
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t dark:border-gray-700 flex-shrink-0">
              <button
                onClick={() => setShowDetail(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 transition"
              >
                Fermer
              </button>
              {/* Marquer traité sans réponse */}
              {avisSelectionne.statut === "en_attente" && !reponse && (
                <button
                  onClick={() => handleTraiter(avisSelectionne.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition text-sm"
                >
                  <MdCheckCircle />
                  Marquer traité
                </button>
              )}

              {/* Envoyer réponse */}
              {avisSelectionne.statut === "en_attente" && reponse && (
                <button
                  onClick={handleRepondre}
                  disabled={loadingReponse}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition disabled:opacity-50"
                >
                  {loadingReponse ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <MdCheckCircle className="text-lg" />
                  )}
                  Envoyer réponse
                </button>
              )}
              <button
                onClick={() => handleSupprimer(avisSelectionne.id)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
              >
                <MdDelete />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
