import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/api";
import { useNavigate } from "react-router-dom";
import {
  MdPerson,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdSave,
  MdArrowBack,
  MdCameraAlt,
  MdLock,
} from "react-icons/md";

export default function MonProfil() {
  const { user, updatePhoto, refreshProfil } = useAuth();
  const navigate = useNavigate();
  const [onglet, setOnglet] = useState("infos");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", texte: "" });

  const [formInfos, setFormInfos] = useState({
    first_name: user?.nom?.split(" ")[0] || "",
    last_name: user?.nom?.split(" ")[1] || "",
    email: user?.email || "",
    telephone: user?.telephone || "",
    zone: user?.zone || "",
  });

  const [formPassword, setFormPassword] = useState({
    ancien_password: "",
    nouveau_password: "",
    confirmer_password: "",
  });

  // Modifier infos profil
  const handleSaveInfos = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.modifierProfil(formInfos);
      await refreshProfil();
      setMessage({ type: "success", texte: "Profil mis à jour avec succès !" });
    } catch (error) {
      setMessage({ type: "error", texte: "Erreur lors de la mise à jour." });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: "", texte: "" }), 3000);
    }
  };

  // Changer photo
  const handlePhotoChange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const response = await authService.modifierPhoto(formData);
      updatePhoto(response.data.photo_url);
      setMessage({ type: "success", texte: "Photo mise à jour !" });
    } catch (error) {
      setMessage({ type: "error", texte: "Erreur upload photo." });
    }
    setTimeout(() => setMessage({ type: "", texte: "" }), 3000);
  };

  const handleSavePassword = async e => {
    e.preventDefault();
    setLoading(true);

    if (formPassword.nouveau_password !== formPassword.confirmer_password) {
      setMessage({
        type: "error",
        texte: "Les mots de passe ne correspondent pas !",
      });
      setLoading(false);
      return;
    }

    try {
      await authService.changerPassword({
        ancien_password: formPassword.ancien_password,
        nouveau_password: formPassword.nouveau_password,
        confirmer_password: formPassword.confirmer_password,
      });
      setMessage({
        type: "success",
        texte: "Mot de passe changé avec succès !",
      });
      setFormPassword({
        ancien_password: "",
        nouveau_password: "",
        confirmer_password: "",
      });
    } catch (error) {
      const erreur =
        error.response?.data?.erreur || "Erreur lors du changement.";
      setMessage({ type: "error", texte: erreur });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: "", texte: "" }), 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
      {/* Carte photo */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="h-36 bg-gradient-to-r from-primary-700 to-primary-400 rounded-t-2xl flex items-center px-6 gap-5">
          {/* Photo */}
          <label className="cursor-pointer group relative flex-shrink-0">
            {user?.photo_url ? (
              <img
                src={user.photo_url}
                alt="Profil"
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-primary-600 text-2xl font-bold">
                  {user?.nom?.charAt(0) || "A"}
                </span>
              </div>
            )}
            {/* Overlay caméra au survol */}
            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <MdCameraAlt className="text-white text-xl" />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>

          {/* Nom + rôle */}
          <div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-wide">
              {user?.nom}
            </h2>
            <span className="bg-white bg-opacity-20 text-white text-xs px-3 py-1 rounded-full inline-block mt-2 font-medium">
              {user?.role === "super_admin"
                ? " Super Admin"
                : ` Admin Zone - ${user?.zone}`}
            </span>
          </div>
        </div>

        {/* Espace blanc sous la bannière */}
        <div className="h-2" />
      </div>
      {/* Onglets */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setOnglet("infos")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition border-b-2 ${
              onglet === "infos"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <MdPerson />
            Mes informations
          </button>
          <button
            onClick={() => setOnglet("password")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition border-b-2 ${
              onglet === "password"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <MdLock />
            Mot de passe
          </button>
        </div>

        {/* Onglet infos */}
        {onglet === "infos" && (
          <form onSubmit={handleSaveInfos} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={formInfos.first_name}
                  onChange={e =>
                    setFormInfos({ ...formInfos, first_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={formInfos.last_name}
                  onChange={e =>
                    setFormInfos({ ...formInfos, last_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formInfos.email}
                  onChange={e =>
                    setFormInfos({ ...formInfos, email: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Téléphone
                </label>
                <div className="relative">
                  <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formInfos.telephone}
                    onChange={e =>
                      setFormInfos({ ...formInfos, telephone: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Zone
                </label>
                <div className="relative">
                  <MdLocationOn className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formInfos.zone}
                    onChange={e =>
                      setFormInfos({ ...formInfos, zone: e.target.value })
                    }
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl transition font-medium"
            >
              <MdSave />
              {loading ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </form>
        )}

        {/* Onglet mot de passe */}
        {onglet === "password" && (
          <form onSubmit={handleSavePassword} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ancien mot de passe
              </label>
              <div className="relative">
                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={formPassword.ancien_password}
                  onChange={e =>
                    setFormPassword({
                      ...formPassword,
                      ancien_password: e.target.value,
                    })
                  }
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={formPassword.nouveau_password}
                  onChange={e =>
                    setFormPassword({
                      ...formPassword,
                      nouveau_password: e.target.value,
                    })
                  }
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={formPassword.confirmer_password}
                  onChange={e =>
                    setFormPassword({
                      ...formPassword,
                      confirmer_password: e.target.value,
                    })
                  }
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl transition font-medium"
            >
              <MdSave />
              Changer le mot de passe
            </button>
          </form>
        )}
      </div>
      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition"
      >
        <MdArrowBack />
        Retour
      </button>
    </div>
  );
}
