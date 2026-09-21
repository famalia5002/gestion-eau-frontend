import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { compteurService } from "../services/api";

// Corriger les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Icône verte (vanne ouverte)
const iconVerte = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Icône rouge (vanne fermée)
const iconRouge = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function Carte() {
  const [compteurs, setCompteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState("tous");

  // Centre de la carte : Sénégal
  const centre = [14.6937, -17.4441];

  useEffect(() => {
    fetchCompteurs();
  }, []);

  const fetchCompteurs = async () => {
    try {
      const response = await compteurService.getAll();
      setCompteurs(response.data);
    } catch (error) {
      console.error("Erreur compteurs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcone = compteur => {
    if (compteur.etat_vanne === "fermee") return iconRouge;
    return iconVerte;
  };

  const compteursFiltres = compteurs.filter(c => {
    if (!c.latitude || !c.longitude) return false;
    if (filtre === "tous") return true;
    if (filtre === "ouverte") return c.etat_vanne === "ouverte";
    if (filtre === "fermee") return c.etat_vanne === "fermee";
    return true;
  });

  const stats = {
    total: compteurs.filter(c => c.latitude && c.longitude).length,
    ouverts: compteurs.filter(c => c.etat_vanne === "ouverte" && c.latitude)
      .length,
    fermes: compteurs.filter(c => c.etat_vanne === "fermee" && c.latitude)
      .length,
  };

  const filtres = [
    { key: "tous", label: "Tous", color: "bg-blue-500" },
    { key: "ouverte", label: "Vannes ouvertes", color: "bg-green-500" },
    { key: "fermee", label: "Vannes fermées", color: "bg-red-500" },
  ];

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Carte des Compteurs
        </h1>
        <p className="text-gray-500 mt-1">
          Visualisation géographique des compteurs Smart Ndiyam
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total compteurs</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-100">
          <p className="text-sm text-green-600">Vannes ouvertes</p>
          <p className="text-2xl font-bold text-green-700">{stats.ouverts}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-100">
          <p className="text-sm text-red-600">Vannes fermées</p>
          <p className="text-2xl font-bold text-red-700">{stats.fermes}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-4">
        {filtres.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltre(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filtre === f.key
                ? `${f.color} text-white`
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Carte */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <MapContainer
            center={centre}
            zoom={13}
            style={{ height: "600px", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {compteursFiltres.map(compteur => (
              <Marker
                key={compteur.id}
                position={[compteur.latitude, compteur.longitude]}
                icon={getIcone(compteur)}
              >
                <Popup>
                  <div className="p-1 min-w-48">
                    <h3 className="font-bold text-gray-800 mb-2 text-base">
                      Compteur {compteur.numero_compteur}
                    </h3>
                    <div className="space-y-1 text-sm">
                      {/* Client */}
                      <p>
                        <span className="text-gray-500">Client : </span>
                        <span className="font-medium">
                          {compteur.client_detail?.nom_complet ||
                            "Non attribué"}
                        </span>
                      </p>

                      {/* Zone */}
                      <p>
                        <span className="text-gray-500">Zone : </span>
                        <span className="font-medium">
                          {compteur.client_detail?.zone || "N/A"}
                        </span>
                      </p>

                      {/* Adresse */}
                      <p>
                        <span className="text-gray-500">Adresse : </span>
                        <span className="font-medium">
                          {compteur.client_detail?.adresse || "N/A"}
                        </span>
                      </p>

                      {/* État vanne avec CSS */}
                      <p className="flex items-center gap-1">
                        <span className="text-gray-500">Vanne : </span>
                        <span
                          className={`font-medium inline-flex items-center gap-1 ${
                            compteur.etat_vanne === "ouverte"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              compteur.etat_vanne === "ouverte"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          {compteur.etat_vanne === "ouverte"
                            ? "Ouverte"
                            : "Fermée"}
                        </span>
                      </p>

                      {/* Téléphone */}
                      {compteur.client_detail?.telephone && (
                        <p>
                          <span className="text-gray-500">Tél : </span>
                          <span className="font-medium">
                            {compteur.client_detail.telephone}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Légende */}
      <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-3">Légende</h3>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">Vanne ouverte</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-gray-600">Vanne fermée</span>
          </div>
        </div>
      </div>
    </div>
  );
}
