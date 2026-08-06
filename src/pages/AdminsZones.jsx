import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/api";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdPerson,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdVisibility,
  MdClose,
  MdSave,
  MdAdminPanelSettings,
  MdCameraAlt,
} from "react-icons/md";

const ZONES = [
  "Dakar 1",
  "Dakar 2",
  "Thiès",
  "Rufisque",
  "Mbour",
  "Diourbel",
  "Louga",
  "Saint-Louis",
  "Tambacounda",
  "Ziguinchor",
];

export default function AdminsZones() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [adminSelectionne, setAdminSelectionne] = useState(null);
  const [adminDetail, setAdminDetail] = useState(null);
  const [message, setMessage] = useState({ type: "", texte: "" });
  const [photoPreview, setPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    telephone: "",
    zone: "",
    photo: null,
  });

  useEffect(() => {
    if (user?.role !== "super_admin") return;
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await authService.getAdmins();
      setAdmins(response.data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const adminsFiltres = admins.filter(
    admin =>
      admin.first_name?.toLowerCase().includes(recherche.toLowerCase()) ||
      admin.last_name?.toLowerCase().includes(recherche.toLowerCase()) ||
      admin.email?.toLowerCase().includes(recherche.toLowerCase()) ||
      admin.zone?.toLowerCase().includes(recherche.toLowerCase())
  );

  // Gestion photo
  const handlePhotoChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData(prev => ({ ...prev, photo: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const ouvrirAjout = () => {
    setAdminSelectionne(null);
    setPhotoPreview(null);
    setFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      telephone: "",
      zone: "",
      photo: null,
    });
    setShowModal(true);
  };

  const ouvrirModification = admin => {
    console.log("Admin sélectionné:", admin);
    console.log("Photo URL:", admin.photo_url);
    setAdminSelectionne(admin);
    setPhotoPreview(admin.photo_url || null);
    setFormData({
      username: admin.username,
      email: admin.email,
      first_name: admin.first_name,
      last_name: admin.last_name,
      password: "",
      telephone: admin.telephone || "",
      zone: admin.zone || "",
      photo: null,
    });
    setShowModal(true);
  };

  const ouvrirDetail = admin => {
    console.log("Détail admin:", admin);
    console.log("Photo URL:", admin.photo_url);
    setAdminDetail(admin);
    setShowDetail(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== "") {
          data.append(key, formData[key]);
        }
      });

      if (adminSelectionne) {
        await authService.updateAdmin(adminSelectionne.id, data);
        setMessage({ type: "success", texte: "Admin modifié avec succès !" });
      } else {
        await authService.createAdmin(data);
        setMessage({
          type: "success",
          texte: "Admin Zone ajouté avec succès !",
        });
      }
      setShowModal(false);
      fetchAdmins();
    } catch (error) {
      const erreurs = error.response?.data;
      const msg = erreurs
        ? Object.values(erreurs).flat().join(", ")
        : "Une erreur est survenue.";
      setMessage({ type: "error", texte: msg });
    }
    setTimeout(() => setMessage({ type: "", texte: "" }), 4000);
  };

  const supprimerAdmin = async id => {
    if (!confirm("Voulez-vous vraiment supprimer cet admin ?")) return;
    try {
      await authService.deleteAdmin(id);
      setMessage({ type: "success", texte: "Admin supprimé avec succès !" });
      fetchAdmins();
    } catch (error) {
      setMessage({ type: "error", texte: "Erreur lors de la suppression." });
    }
    setTimeout(() => setMessage({ type: "", texte: "" }), 3000);
  };

  if (user?.role !== "super_admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MdAdminPanelSettings className="text-6xl text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Accès réservé au Super Admin</p>
        </div>
      </div>
    );
  }

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
            Admins Zones
          </h3>
          <p className="text-sm text-gray-500">
            {admins.length} admin(s) zone enregistré(s)
          </p>
        </div>
        <button
          onClick={ouvrirAjout}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl transition font-medium"
        >
          <MdAdd className="text-xl" />
          Ajouter un Admin Zone
        </button>
      </div>

      {/* Recherche */}
      <div className="relative">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
        <input
          type="text"
          placeholder="Rechercher un admin..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        ) : adminsFiltres.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MdAdminPanelSettings className="text-5xl mx-auto mb-2 opacity-30" />
            <p>Aucun admin zone trouvé</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {["Admin", "Contact", "Zone", "Actions"].map(h => (
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
              {adminsFiltres.map(admin => (
                <tr
                  key={admin.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  {/* Admin */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {admin.photo_url ? (
                        <img
                          src={admin.photo_url}
                          alt="Photo"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <MdAdminPanelSettings className="text-primary-600 text-xl" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {admin.first_name} {admin.last_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          @{admin.username}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <MdEmail className="text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-40">{admin.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <MdPhone className="text-gray-400 flex-shrink-0" />
                        {admin.telephone || "N/A"}
                      </div>
                    </div>
                  </td>

                  {/* Zone */}
                  <td className="px-6 py-4">
                    <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                      <MdLocationOn className="text-primary-500" />
                      {admin.zone || "Non définie"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => ouvrirDetail(admin)}
                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                        title="Voir détails"
                      >
                        <MdVisibility />
                      </button>
                      <button
                        onClick={() => ouvrirModification(admin)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                        title="Modifier"
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => supprimerAdmin(admin.id)}
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                {adminSelectionne
                  ? "Modifier Admin Zone"
                  : "Ajouter Admin Zone"}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <MdClose className="text-gray-400 text-2xl hover:text-gray-600" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4"
              autoComplete="off"
            >
              {/* Photo */}
              <div className="flex justify-center">
                <label className="cursor-pointer group relative">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Photo"
                      className="w-20 h-20 rounded-full object-cover border-4 border-primary-200"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary-400 transition">
                      <MdCameraAlt className="text-gray-400 text-2xl" />
                      <span className="text-xs text-gray-400 mt-1">Photo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <MdCameraAlt className="text-white text-xl" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Prénom + Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prénom *
                  </label>
                  <div className="relative">
                    <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={e =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      autoComplete="off"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom *
                  </label>
                  <div className="relative">
                    <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={e =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      autoComplete="off"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Username + Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    autoComplete="new-username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      autoComplete="off"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password - seulement à l'ajout */}
              {!adminSelectionne && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    autoComplete="new-password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              )}

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Téléphone
                </label>
                <div className="relative">
                  <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.telephone}
                    onChange={e =>
                      setFormData({ ...formData, telephone: e.target.value })
                    }
                    autoComplete="off"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Zone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Zone assignée *
                </label>
                <div className="relative">
                  <MdLocationOn className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                  <select
                    value={formData.zone}
                    onChange={e =>
                      setFormData({ ...formData, zone: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none bg-white dark:bg-gray-700"
                    required
                  >
                    <option value="">Sélectionner une zone...</option>
                    {ZONES.map(zone => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition font-medium"
                >
                  <MdSave />
                  {adminSelectionne ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL DETAIL ===== */}
      {showDetail && adminDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Détails Admin Zone
              </h3>
              <button onClick={() => setShowDetail(false)}>
                <MdClose className="text-gray-400 text-2xl hover:text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Photo + nom */}
              <div className="flex items-center gap-4">
                {adminDetail.photo_url ? (
                  <img
                    src={adminDetail.photo_url}
                    alt="Photo"
                    className="w-16 h-16 rounded-xl object-cover border-2 border-primary-200"
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
                    <MdAdminPanelSettings className="text-primary-600 text-3xl" />
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-bold text-gray-800 dark:text-white">
                    {adminDetail.first_name} {adminDetail.last_name}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    @{adminDetail.username}
                  </p>
                  <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full">
                    Admin Zone
                  </span>
                </div>
              </div>

              {/* Infos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Email</p>
                  <div className="flex items-center gap-1">
                    <MdEmail className="text-primary-500 flex-shrink-0" />
                    <p className="text-sm text-gray-800 dark:text-white truncate">
                      {adminDetail.email}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Téléphone</p>
                  <div className="flex items-center gap-1">
                    <MdPhone className="text-primary-500" />
                    <p className="text-sm text-gray-800 dark:text-white">
                      {adminDetail.telephone || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Zone assignée</p>
                  <div className="flex items-center gap-1">
                    <MdLocationOn className="text-primary-500" />
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      {adminDetail.zone || "Non définie"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons */}
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
                  ouvrirModification(adminDetail);
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
