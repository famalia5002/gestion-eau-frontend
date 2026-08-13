import axios from "axios";

// URL de base de votre backend Django
const BASE_URL = "http://localhost:8000/api";

// Créer une instance axios
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur : ajouter le token automatiquement
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Intercepteur : gérer les erreurs 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ===== AUTHENTIFICATION =====
export const authService = {
  connexion: data => api.post("/auth/connexion/", data),
  deconnexion: refresh => api.post("/auth/deconnexion/", { refresh }),
  profil: () => api.get("/auth/profil/"),
  modifierProfil: data => api.put("/auth/profil/modifier/", data),
  modifierPhoto: formData =>
    api.post("/auth/profil/photo/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  changerPassword: data => api.post("/auth/profil/password/", data),
  getAdmins: () => api.get("/auth/admins/"),
  createAdmin: data =>
    api.post("/auth/admins/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateAdmin: (id, data) =>
    api.put(`/auth/admins/${id}/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteAdmin: id => api.delete(`/auth/admins/${id}/`),
};

// ===== DASHBOARD =====
export const dashboardService = {
  getStats: () => api.get("/dashboard/"),
};

// ===== CLIENTS =====
export const clientService = {
  getAll: () => api.get("/auth/clients/"),
  getOne: id => api.get(`/auth/clients/${id}/`),
  create: data =>
    api.post("/auth/clients/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, data) =>
    api.patch(`/auth/clients/${id}/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: id => api.delete(`/auth/clients/${id}/`),
};

// ===== COMPTEURS =====
export const compteurService = {
  getAll: () => api.get("/compteurs/"),
  getOne: id => api.get(`/compteurs/${id}/`),
  create: data => api.post("/compteurs/", data),
  update: (id, data) => api.put(`/compteurs/${id}/`, data),
  delete: id => api.delete(`/compteurs/${id}/`),
  associer: (id, clientId) =>
    api.post(`/compteurs/${id}/associer/`, { client_id: clientId }),
  desassocier: id => api.post(`/compteurs/${id}/desassocier/`),
  controlerVanne: (id, action) =>
    api.post(`/compteurs/${id}/vanne/`, { action }),
};

// ===== CONSOMMATION =====
export const consommationService = {
  getAll: periode => api.get(`/consommation/?periode=${periode}`),
  getIndex: compteurId => api.get(`/consommation/index/${compteurId}/`),
};

// ===== FACTURES =====
export const factureService = {
  getAll: () => api.get("/factures/"),
  getOne: id => api.get(`/factures/${id}/`),
  payer: (id, mode) =>
    api.post(`/factures/${id}/payer/`, {
      mode_paiement: mode,
    }),
  generer: clientId =>
    api.post("/factures/generer/", {
      client_id: clientId,
    }),
  genererToutes: () => api.post("/factures/generer-toutes/"),
};

// ===== ALERTES =====
export const alerteService = {
  getAll: () => api.get("/alertes/"),
  resoudre: id => api.post(`/alertes/${id}/resoudre/`),
  getCommandes: () => api.get("/alertes/commandes/"),
};

// ===== AVIS =====
export const avisService = {
  getAll: () => api.get("/avis/"),
  create: data => api.post("/avis/", data),
  delete: id => api.delete(`/avis/${id}/`),
  repondre: (id, reponse) => api.post(`/avis/${id}/repondre/`, { reponse }),
  traiter: id => api.post(`/avis/${id}/traiter/`),
};

export const demandeService = {
  getAll: () => api.get("/demandes/"),
  creer: data =>
    api.post("/demandes/creer/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  traiter: (id, data) => api.post(`/demandes/${id}/traiter/`, data),
};

export default api;
