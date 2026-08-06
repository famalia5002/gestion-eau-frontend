import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { consommationService, compteurService } from "../services/api";
import {
  MdArrowBack,
  MdWater,
  MdShowChart,
  MdArrowUpward,
  MdArrowDownward,
  MdCalendarToday,
} from "react-icons/md";

export default function IndexCompteur() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [index, setIndex] = useState([]);
  const [compteur, setCompteur] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [indexRes, compteurRes] = await Promise.all([
        consommationService.getIndex(id),
        compteurService.getOne(id),
      ]);
      setIndex(indexRes.data);
      setCompteur(compteurRes.data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/compteurs")}
          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 transition"
        >
          <MdArrowBack className="text-gray-600 dark:text-gray-300 text-xl" />
        </button>
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Historique des index
          </h3>
          {compteur && (
            <p className="text-sm text-gray-500">
              Compteur {compteur.numero_compteur}
              {compteur.client_detail
                ? ` - ${compteur.client_detail.first_name} ${compteur.client_detail.last_name}`
                : ""}
            </p>
          )}
        </div>
      </div>

      {/* Infos compteur */}
      {compteur && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-xl">
              <MdWater className="text-blue-600 text-2xl mx-auto mb-2" />
              <p className="text-xs text-gray-400">Compteur</p>
              <p className="font-bold text-gray-800 dark:text-white">
                {compteur.numero_compteur}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-xl">
              <MdShowChart className="text-green-600 text-2xl mx-auto mb-2" />
              <p className="text-xs text-gray-400">Dernier index</p>
              <p className="font-bold text-gray-800 dark:text-white">
                {index.length > 0 ? `${index[0].valeur_index} m³` : "N/A"}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-xl">
              <MdCalendarToday className="text-purple-600 text-2xl mx-auto mb-2" />
              <p className="text-xs text-gray-400">Nombre de relevés</p>
              <p className="font-bold text-gray-800 dark:text-white">
                {index.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Liste des index */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b dark:border-gray-700">
          <h4 className="font-bold text-gray-800 dark:text-white">
            Relevés des index
          </h4>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        ) : index.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MdShowChart className="text-5xl mx-auto mb-2 opacity-30" />
            <p>Aucun index disponible</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {["N°", "Valeur index", "Variation", "Date relevé"].map(h => (
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
              {index.map((idx, i) => {
                const variation =
                  i < index.length - 1
                    ? idx.valeur_index - index[i + 1].valeur_index
                    : null;

                return (
                  <tr
                    key={idx.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <span className="text-primary-600 text-xs font-bold">
                          {i + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {idx.valeur_index} m³
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {variation !== null ? (
                        <div
                          className={`flex items-center gap-1 text-sm font-medium ${
                            variation > 0 ? "text-red-500" : "text-green-500"
                          }`}
                        >
                          {variation > 0 ? (
                            <MdArrowUpward />
                          ) : (
                            <MdArrowDownward />
                          )}
                          {Math.abs(variation).toFixed(4)} m³
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Premier relevé
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <MdCalendarToday className="text-gray-400 text-sm" />
                        {new Date(idx.date_releve).toLocaleString("fr-FR")}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
