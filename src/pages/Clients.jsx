import { useState, useEffect } from "react";
import { clientService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdPerson,
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdVisibility,
  MdClose,
  MdSave,
  MdCameraAlt,
} from "react-icons/md";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix icône Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Composant pour clic sur carte
function SelecPositionCarte({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
// Composant pour centrer la carte
function CentrerCarte({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 16, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [position, map]);
  return null;
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [clientSelectionne, setClientSelectionne] = useState(null);
  const [clientDetail, setClientDetail] = useState(null);
  const [message, setMessage] = useState({ type: "", texte: "" });
  const [position, setPosition] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const { user } = useAuth();
  const [filtreZone, setFiltreZone] = useState("toutes");
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

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    telephone: "",
    adresse: "",
    zone: "",
    latitude: "",
    longitude: "",
    photo: null,
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await clientService.getAll();
      setClients(response.data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };
  // Fonction géocodage
  const geocoderAdresse = async adresse => {
    if (!adresse || adresse.length < 5) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(adresse + ", Sénégal")}&format=json&limit=1`,
        { headers: { "Accept-Language": "fr" } }
      );
      const data = await response.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setPosition({ lat, lng });
        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
        }));
      }
    } catch (error) {
      console.error("Erreur géocodage:", error);
    }
  };

  const clientsFiltres = clients.filter(client => {
    const matchRecherche =
      client.first_name?.toLowerCase().includes(recherche.toLowerCase()) ||
      client.last_name?.toLowerCase().includes(recherche.toLowerCase()) ||
      client.email?.toLowerCase().includes(recherche.toLowerCase()) ||
      client.username?.toLowerCase().includes(recherche.toLowerCase());

    const matchZone = filtreZone === "toutes" || client.zone === filtreZone;

    return matchRecherche && matchZone;
  });

  const ouvrirAjout = () => {
    setClientSelectionne(null);
    setPosition(null);
    setPhotoPreview(null);
    setFormData({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      telephone: "",
      adresse: "",
      zone: user?.role === "admin_zone" ? user.zone : "",
      latitude: "",
      longitude: "",
      photo: null,
    });
    setShowModal(true);
  };

  const ouvrirModification = client => {
    setClientSelectionne(client);
    setPhotoPreview(client.photo_url || null);
    setPosition(
      client.latitude && client.longitude
        ? { lat: client.latitude, lng: client.longitude }
        : null
    );
    setFormData({
      username: client.username,
      email: client.email,
      first_name: client.first_name,
      last_name: client.last_name,
      password: "",
      telephone: client.telephone || "",
      adresse: client.adresse || "",
      zone: client.zone || "",
      latitude: client.latitude || "",
      longitude: client.longitude || "",
      photo: null,
    });
    setShowModal(true);
  };

  const ouvrirDetail = client => {
    setClientDetail(client);
    setShowDetail(true);
  };

  // Sélection position sur carte
  const handleSelectPosition = (lat, lng) => {
    setPosition({ lat, lng });
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  };

  // Gestion photo
  const handlePhotoChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData(prev => ({ ...prev, photo: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Soumettre formulaire
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== "") {
          data.append(key, formData[key]);
        }
      });

      if (clientSelectionne) {
        await clientService.update(clientSelectionne.id, data);
        setMessage({ type: "success", texte: "Client modifié avec succès !" });
      } else {
        await clientService.create(data);
        setMessage({ type: "success", texte: "Client ajouté avec succès !" });
      }
      setShowModal(false);
      fetchClients();
    } catch (error) {
      setMessage({ type: "error", texte: "Une erreur est survenue." });
    }
    setTimeout(() => setMessage({ type: "", texte: "" }), 3000);
  };

  const supprimerClient = async id => {
    if (!confirm("Voulez-vous vraiment supprimer ce client ?")) return;
    try {
      await clientService.delete(id);
      setMessage({ type: "success", texte: "Client supprimé !" });
      fetchClients();
    } catch (error) {
      setMessage({ type: "error", texte: "Erreur lors de la suppression." });
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
            Liste des clients
          </h3>
          <p className="text-sm text-gray-500">{clients.length} client(s)</p>
        </div>
        <button
          onClick={ouvrirAjout}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl transition font-medium"
        >
          <MdAdd className="text-xl" />
          Ajouter un client
        </button>
      </div>

      {user?.role === "super_admin" && (
        <div className="flex items-center gap-3">
          <select
            value={filtreZone}
            onChange={e => setFiltreZone(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
          >
            <option value="toutes">Toutes les zones</option>
            {ZONES.map(zone => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Recherche */}
      <div className="relative">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
        <input
          type="text"
          placeholder="Rechercher un client..."
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
        ) : clientsFiltres.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MdPerson className="text-5xl mx-auto mb-2 opacity-30" />
            <p>Aucun client trouvé</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {["Client", "Contact", "Zone", "GPS", "Actions"].map(h => (
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
              {clientsFiltres.map(client => (
                <tr
                  key={client.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {client.photo_url ? (
                        <img
                          src={client.photo_url}
                          alt="Photo"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-bold">
                            {client.first_name?.charAt(0) ||
                              client.username?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {client.first_name} {client.last_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          @{client.username}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <MdEmail className="text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-32">
                          {client.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <MdPhone className="text-gray-400 flex-shrink-0" />
                        {client.telephone || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                      {client.zone || "Non définie"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {client.latitude && client.longitude ? (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <MdLocationOn className="text-green-500" />
                        {parseFloat(client.latitude).toFixed(4)},{" "}
                        {parseFloat(client.longitude).toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Non défini</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => ouvrirDetail(client)}
                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                        title="Voir détails"
                      >
                        <MdVisibility />
                      </button>
                      <button
                        onClick={() => ouvrirModification(client)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                        title="Modifier"
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => supprimerClient(client.id)}
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                {clientSelectionne ? "Modifier le client" : "Ajouter un client"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MdClose className="text-2xl" />
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
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary-400 transition">
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

              {/* Password (ajout seulement) */}
              {!clientSelectionne && (
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

              {/* Téléphone + Zone */}
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Zone
                  </label>
                  {user?.role === "admin_zone" ? (
                    // Admin zone → zone en lecture seule
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900 border border-blue-200 rounded-xl">
                      <MdLocationOn className="text-blue-500" />
                      <span className="text-blue-700 dark:text-blue-300 font-medium">
                        {user.zone}
                      </span>
                    </div>
                  ) : (
                    // Super admin → liste déroulante
                    <div className="relative">
                      <MdLocationOn className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                      <select
                        value={formData.zone}
                        onChange={e =>
                          setFormData({ ...formData, zone: e.target.value })
                        }
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none bg-white"
                      >
                        <option value="">Sélectionner une zone...</option>
                        {ZONES.map(zone => (
                          <option key={zone} value={zone}>
                            {zone}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresse
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={formData.adresse}
                    onChange={e =>
                      setFormData({ ...formData, adresse: e.target.value })
                    }
                    rows={2}
                    placeholder="Ex: HLM Fass, Rue 10, Dakar"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => geocoderAdresse(formData.adresse)}
                    className="px-3 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition flex items-center gap-1 text-sm"
                    title="Localiser sur la carte"
                  >
                    <MdLocationOn className="text-lg" />
                    Localiser
                  </button>
                </div>
              </div>

              {/* Carte GPS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MdLocationOn className="inline text-primary-500 mr-1" />
                  Position GPS (cliquez sur la carte)
                </label>
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                  <MapContainer
                    center={
                      position
                        ? [position.lat, position.lng]
                        : [14.6937, -17.4441]
                    }
                    zoom={13}
                    style={{ height: "220px", width: "100%" }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap"
                    />
                    <SelecPositionCarte onSelect={handleSelectPosition} />
                    <CentrerCarte position={position} />
                    {position && (
                      <Marker position={[position.lat, position.lng]} />
                    )}
                  </MapContainer>
                </div>
                {position && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <MdLocationOn />
                    Position : {position.lat.toFixed(4)},{" "}
                    {position.lng.toFixed(4)}
                  </p>
                )}
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
                  {clientSelectionne ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL DETAIL CLIENT ===== */}
      {showDetail && clientDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header fixe */}
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Détails du client
              </h3>
              <button onClick={() => setShowDetail(false)}>
                <MdClose className="text-gray-400 text-2xl hover:text-gray-600" />
              </button>
            </div>

            {/* Contenu scrollable */}
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Photo + nom */}
              <div className="flex items-center gap-4">
                {clientDetail.photo_url ? (
                  <img
                    src={clientDetail.photo_url}
                    alt="Photo"
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
                    <span className="text-primary-600 text-2xl font-bold">
                      {clientDetail.first_name?.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-bold text-gray-800 dark:text-white">
                    {clientDetail.first_name} {clientDetail.last_name}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    @{clientDetail.username}
                  </p>
                </div>
              </div>

              {/* Infos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Email</p>
                  <div className="flex items-center gap-1">
                    <MdEmail className="text-primary-500 flex-shrink-0" />
                    <p className="text-sm text-gray-800 dark:text-white truncate">
                      {clientDetail.email}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Téléphone</p>
                  <div className="flex items-center gap-1">
                    <MdPhone className="text-primary-500" />
                    <p className="text-sm text-gray-800 dark:text-white">
                      {clientDetail.telephone || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Zone</p>
                  <div className="flex items-center gap-1">
                    <MdLocationOn className="text-primary-500" />
                    <p className="text-sm text-gray-800 dark:text-white">
                      {clientDetail.zone || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">GPS</p>
                  <div className="flex items-center gap-1">
                    <MdLocationOn className="text-green-500" />
                    <p className="text-sm text-gray-800 dark:text-white">
                      {clientDetail.latitude
                        ? `${parseFloat(clientDetail.latitude).toFixed(4)}, ${parseFloat(clientDetail.longitude).toFixed(4)}`
                        : "Non défini"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Adresse */}
              {clientDetail.adresse && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Adresse</p>
                  <p className="text-sm text-gray-800 dark:text-white">
                    {clientDetail.adresse}
                  </p>
                </div>
              )}

              {/* Mini carte si GPS disponible */}
              {clientDetail.latitude && clientDetail.longitude && (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <MapContainer
                    center={[clientDetail.latitude, clientDetail.longitude]}
                    zoom={15}
                    style={{ height: "180px", width: "100%" }}
                    dragging={false}
                    scrollWheelZoom={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker
                      position={[clientDetail.latitude, clientDetail.longitude]}
                    />
                  </MapContainer>
                </div>
              )}
            </div>

            {/* Boutons fixe en bas */}
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
                  ouvrirModification(clientDetail);
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
