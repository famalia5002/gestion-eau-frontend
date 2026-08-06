import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { compteurService, clientService } from "../services/api";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdWater,
  MdPerson,
  MdClose,
  MdSave,
  MdVisibility,
  MdLocationOn,
  MdLock,
  MdLockOpen,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { MdShowChart } from "react-icons/md";

const STATUTS = ["disponible", "attribue", "en_panne"];
const STATUTS_LABELS = {
  disponible: { label: "Disponible", color: "bg-green-50 text-green-700" },
  attribue: { label: "Attribué", color: "bg-blue-50 text-blue-700" },
  en_panne: { label: "En panne", color: "bg-red-50 text-red-700" },
};

export default function Compteurs() {
  const { user } = useAuth();
  const [compteurs, setCompteurs] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showAssocier, setShowAssocier] = useState(false);
  const [compteurSelectionne, setCompteurSelectionne] = useState(null);
  const [compteurDetail, setCompteurDetail] = useState(null);
  const [message, setMessage] = useState({ type: "", texte: "" });
  const [clientChoisi, setClientChoisi] = useState("");
  const [actionVanne, setActionVanne] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    numero_compteur: "",
    serie: "",
    statut: "disponible",
  });

  useEffect(() => {
    fetchCompteurs();
    fetchClients();
  }, []);

  const fetchCompteurs = async () => {
    try {
      const response = await compteurService.getAll();
      setCompteurs(response.data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientService.getAll();
      setClients(response.data);
    } catch (error) {
      console.error("Erreur clients:", error);
    }
  };

  // Filtrer compteurs
  const compteursFiltres = compteurs.filter(c => {
    const matchRecherche =
      c.numero_compteur?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.serie?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.client_detail?.first_name
        ?.toLowerCase()
        .includes(recherche.toLowerCase()) ||
      c.client_detail?.last_name
        ?.toLowerCase()
        .includes(recherche.toLowerCase());

    const matchStatut = filtreStatut === "tous" || c.statut === filtreStatut;
    return matchRecherche && matchStatut;
  });

  const ouvrirAjout = () => {
    setCompteurSelectionne(null);
    setFormData({ numero_compteur: "", serie: "", statut: "disponible" });
    setShowModal(true);
  };

  const ouvrirModification = compteur => {
    setCompteurSelectionne(compteur);
    setFormData({
      numero_compteur: compteur.numero_compteur,
      serie: compteur.serie,
      statut: compteur.statut,
    });
    setShowModal(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (compteurSelectionne) {
        await compteurService.update(compteurSelectionne.id, formData);
        setMessage({
          type: "success",
          texte: "Compteur modifié avec succès !",
        });
      } else {
        await compteurService.create(formData);
        setMessage({ type: "success", texte: "Compteur ajouté avec succès !" });
      }
      setShowModal(false);
      fetchCompteurs();
    } catch (error) {
      setMessage({ type: "error", texte: "Une erreur est survenue." });
    }
    setTimeout(() => setMessage({ type: "", texte: "" }), 3000);
  };

  const supprimerCompteur = async id => {
    if (!confirm("Voulez-vous vraiment supprimer ce compteur ?")) return;
    try {
      await compteurService.delete(id);
      setMessage({ type: "success", texte: "Compteur supprimé !" });
      fetchCompteurs();
    } catch (error) {
      setMessage({ type: "error", texte: "Erreur lors de la suppression." });
    }
    setTimeout(() => setMessage({ type: "", texte: "" }), 3000);
  };

  // Associer compteur à client
  const handleAssocier = async () => {
    if (!clientChoisi) return;
    try {
      await compteurService.associer(compteurSelectionne.id, clientChoisi);
      setMessage({ type: "success", texte: "Compteur associé avec succès !" });
      setShowAssocier(false);
      fetchCompteurs();
    } catch (error) {
      setMessage({ type: "error", texte: "Erreur lors de l'association." });
    }
    setTimeout(() => setMessage({ type: "", texte: "" }), 3000);
  };

  // Contrôler vanne
  const handleControlerVanne = async (compteur, action) => {
    try {
      await compteurService.controlerVanne(compteur.id, action);
      setMessage({
        type: "success",
        texte: `Vanne ${action === "ouvrir" ? "ouverte" : "fermée"} avec succès !`,
      });
      fetchCompteurs();
    } catch (error) {
      setMessage({ type: "error", texte: "Erreur contrôle vanne." });
    }
    setTimeout(() => setMessage({ type: "", texte: "" }), 3000);
  };
  const desassocierCompteur = async id => {
    if (!confirm("Voulez-vous désassocier ce compteur de son client ?")) return;
    try {
      await compteurService.desassocier(id);
      setMessage({
        type: "success",
        texte: "Compteur désassocié avec succès !",
      });
      fetchCompteurs();
    } catch (error) {
      console.error("Erreur:", error.response?.data);
      setMessage({ type: "error", texte: "Erreur lors de la désassociation." });
    }
    setTimeout(() => setMessage({ type: "", texte: "" }), 3000);
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
          {message.type === "success" ? "✅" : "❌"} {message.texte}
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Gestion des Compteurs
          </h3>
          <p className="text-sm text-gray-500">
            {compteurs.length} compteur(s) enregistré(s)
          </p>
        </div>
        <button
          onClick={ouvrirAjout}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl transition font-medium"
        >
          <MdAdd className="text-xl" />
          Ajouter un compteur
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Rechercher un compteur..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        <select
          value={filtreStatut}
          onChange={e => setFiltreStatut(e.target.value)}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="tous">Tous les statuts</option>
          {STATUTS.map(s => (
            <option key={s} value={s}>
              {STATUTS_LABELS[s].label}
            </option>
          ))}
        </select>
      </div>

      {/* Cartes statistiques rapides */}
      <div className="grid grid-cols-3 gap-4">
        {STATUTS.map(statut => (
          <div
            key={statut}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex items-center gap-3"
          >
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${STATUTS_LABELS[statut].color}`}
            >
              {STATUTS_LABELS[statut].label}
            </div>
            <span className="text-2xl font-bold text-gray-800 dark:text-white">
              {compteurs.filter(c => c.statut === statut).length}
            </span>
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        ) : compteursFiltres.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MdWater className="text-5xl mx-auto mb-2 opacity-30" />
            <p>Aucun compteur trouvé</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {[
                  "Compteur",
                  "Série",
                  "Statut",
                  "Client",
                  "Vanne",
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
              {compteursFiltres.map(compteur => (
                <tr
                  key={compteur.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  {/* Numéro */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <MdWater className="text-blue-600 text-xl" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {compteur.numero_compteur}
                        </p>
                        <p className="text-xs text-gray-400">
                          ID: {compteur.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Série */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {compteur.serie}
                    </p>
                  </td>

                  {/* Statut */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        STATUTS_LABELS[compteur.statut]?.color ||
                        "bg-gray-50 text-gray-700"
                      }`}
                    >
                      {STATUTS_LABELS[compteur.statut]?.label ||
                        compteur.statut}
                    </span>
                  </td>

                  {/* Client */}
                  <td className="px-6 py-4">
                    {compteur.client_detail ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 text-xs font-bold">
                              {compteur.client_detail.first_name?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {compteur.client_detail.first_name}{" "}
                              {compteur.client_detail.last_name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {compteur.client_detail.zone}
                            </p>
                          </div>
                        </div>
                        {/* Bouton désassocier */}
                        <button
                          onClick={() => desassocierCompteur(compteur.id)}
                          className="ml-2 p-1 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition"
                          title="Désassocier ce client"
                        >
                          <MdClose className="text-sm" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setCompteurSelectionne(compteur);
                          setClientChoisi("");
                          setShowAssocier(true);
                        }}
                        className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <MdPerson className="text-base" />
                        Associer un client
                      </button>
                    )}
                  </td>

                  {/* Vanne */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          compteur.etat_vanne === "ouverte"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {compteur.etat_vanne === "ouverte" ? (
                          <MdLockOpen className="text-sm" />
                        ) : (
                          <MdLock className="text-sm" />
                        )}
                        {compteur.etat_vanne === "ouverte"
                          ? "Ouverte"
                          : "Fermée"}
                      </span>
                      <button
                        onClick={() =>
                          handleControlerVanne(
                            compteur,
                            compteur.etat_vanne === "ouverte"
                              ? "fermer"
                              : "ouvrir"
                          )
                        }
                        className={`p-1.5 rounded-lg text-xs transition ${
                          compteur.etat_vanne === "ouverte"
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                        title={
                          compteur.etat_vanne === "ouverte"
                            ? "Fermer la vanne"
                            : "Ouvrir la vanne"
                        }
                      >
                        {compteur.etat_vanne === "ouverte" ? (
                          <MdLock />
                        ) : (
                          <MdLockOpen />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCompteurDetail(compteur);
                          setShowDetail(true);
                        }}
                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                        title="Voir détails"
                      >
                        <MdVisibility />
                      </button>
                      <button
                        onClick={() => ouvrirModification(compteur)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                        title="Modifier"
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => supprimerCompteur(compteur.id)}
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

      {/* ===== MODAL AJOUT/MODIFICATION ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                {compteurSelectionne
                  ? "Modifier le compteur"
                  : "Ajouter un compteur"}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <MdClose className="text-gray-400 text-2xl" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Numéro de compteur *
                </label>
                <div className="relative">
                  <MdWater className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.numero_compteur}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        numero_compteur: e.target.value,
                      })
                    }
                    placeholder="Ex: C001"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Numéro de série *
                </label>
                <input
                  type="text"
                  value={formData.serie}
                  onChange={e =>
                    setFormData({ ...formData, serie: e.target.value })
                  }
                  placeholder="Ex: SN-2025-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              {compteurSelectionne && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.statut}
                    onChange={e =>
                      setFormData({ ...formData, statut: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {STATUTS.map(s => (
                      <option key={s} value={s}>
                        {STATUTS_LABELS[s].label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition font-medium"
                >
                  <MdSave />
                  {compteurSelectionne ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL ASSOCIER CLIENT ===== */}
      {showAssocier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Associer un client
              </h3>
              <button onClick={() => setShowAssocier(false)}>
                <MdClose className="text-gray-400 text-2xl" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Compteur :{" "}
                  <strong>{compteurSelectionne?.numero_compteur}</strong>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Choisir un client
                </label>
                <select
                  value={clientChoisi}
                  onChange={e => setClientChoisi(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Sélectionner un client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name} -{" "}
                      {client.zone || "N/A"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssocier(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAssocier}
                  disabled={!clientChoisi}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition font-medium disabled:opacity-50"
                >
                  <MdPerson />
                  Associer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL DETAIL ===== */}
      {showDetail && compteurDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Détails du compteur
              </h3>
              <button onClick={() => setShowDetail(false)}>
                <MdClose className="text-gray-400 text-2xl" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Numéro */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center">
                  <MdWater className="text-blue-600 text-3xl" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-800 dark:text-white">
                    {compteurDetail.numero_compteur}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Série : {compteurDetail.serie}
                  </p>
                </div>
              </div>

              {/* Infos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Statut</p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      STATUTS_LABELS[compteurDetail.statut]?.color
                    }`}
                  >
                    {STATUTS_LABELS[compteurDetail.statut]?.label}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">État vanne</p>
                  <span
                    className={`flex items-center gap-1 text-xs font-medium ${
                      compteurDetail.etat_vanne === "ouverte"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {compteurDetail.etat_vanne === "ouverte" ? (
                      <MdLockOpen />
                    ) : (
                      <MdLock />
                    )}
                    {compteurDetail.etat_vanne === "ouverte"
                      ? "Ouverte"
                      : "Fermée"}
                  </span>
                </div>
              </div>

              {/* Client associé */}
              {compteurDetail.client_detail && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-2">Client associé</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold">
                        {compteurDetail.client_detail.first_name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white text-sm">
                        {compteurDetail.client_detail.first_name}{" "}
                        {compteurDetail.client_detail.last_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {compteurDetail.client_detail.email}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MdLocationOn className="text-primary-500" />
                        {compteurDetail.client_detail.zone ||
                          "Zone non définie"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Date installation */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">
                  Date d'installation
                </p>
                <p className="text-sm text-gray-800 dark:text-white">
                  {new Date(
                    compteurDetail.date_installation
                  ).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetail(false);
                  navigate(`/admin/compteurs/${compteurDetail.id}/index`);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 transition text-sm"
              >
                <MdShowChart />
                Voir historique des index
              </button>
            </div>

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
                  ouvrirModification(compteurDetail);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition"
              >
                <MdEdit />
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
