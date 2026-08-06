import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  MdPerson,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdEdit,
  MdSave,
} from "react-icons/md";

export default function Profil() {
  const { user, updatePhoto } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: user?.nom || "",
    email: "",
    telephone: "",
    zone: user?.zone || "",
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Carte profil */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Bannière */}
        <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-400" />

        {/* Photo + infos */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            {user?.photo ? (
              <img
                src={user.photo}
                alt="Profil"
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-primary-500 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-white text-3xl font-bold">
                  {user?.nom?.charAt(0) || "A"}
                </span>
              </div>
            )}
            <div className="pb-2">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {user?.nom || "Administrateur"}
              </h2>
              <span className="bg-primary-100 text-primary-700 text-xs px-3 py-1 rounded-full font-medium">
                {user?.role === "super_admin"
                  ? "⭐ Super Admin"
                  : `📍 Admin Zone - ${user?.zone}`}
              </span>
            </div>
          </div>

          {/* Informations */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <MdPerson className="text-primary-500 text-xl" />
              <div>
                <p className="text-xs text-gray-400">Nom complet</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {user?.nom || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <MdLocationOn className="text-primary-500 text-xl" />
              <div>
                <p className="text-xs text-gray-400">Zone</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {user?.zone || "Non définie"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        className="w-full py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition"
      >
        ← Retour
      </button>
    </div>
  );
}
