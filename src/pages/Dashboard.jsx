import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { dashboardService } from "../services/api";
import {
  MdPeople,
  MdWater,
  MdShowChart,
  MdNotifications,
  MdReceipt,
  MdWarning,
} from "react-icons/md";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Couleurs zones
const COULEURS_ZONES = [
  "#2E75B6",
  "#1F6B3A",
  "#854F0B",
  "#534AB7",
  "#A32D2D",
  "#3B6D11",
  "#0F6E56",
  "#7B3F00",
  "#2F5496",
  "#E6A817",
];

// Carte statistique
function StatCard({ icon: Icon, titre, valeur, couleur, bg, unite }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition">
      <div className={`${bg} p-4 rounded-xl flex-shrink-0`}>
        <Icon className={`text-2xl ${couleur}`} />
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{titre}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">
          {valeur}{" "}
          {unite && (
            <span className="text-sm font-normal text-gray-400">{unite}</span>
          )}
        </p>
      </div>
    </div>
  );
}

// Tooltip personnalisé
function TooltipPerso({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 border border-gray-100">
        <p className="font-semibold text-gray-700 dark:text-white text-sm">
          {label}
        </p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            {p.value} litres
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getStats();
        setStats(response.data.statistiques);
      } catch (error) {
        console.error("Erreur dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== CARTES STATISTIQUES ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={MdPeople}
          titre="Total Clients"
          valeur={stats?.total_clients || 0}
          couleur="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          icon={MdWater}
          titre="Compteurs Actifs"
          valeur={stats?.compteurs_actifs || 0}
          couleur="text-green-600"
          bg="bg-green-50"
        />
        <StatCard
          icon={MdShowChart}
          titre="Conso. Aujourd'hui"
          valeur={stats?.consommation_jour || 0}
          unite="L"
          couleur="text-purple-600"
          bg="bg-purple-50"
        />
        <StatCard
          icon={MdNotifications}
          titre="Alertes en cours"
          valeur={stats?.alertes_en_cours || 0}
          couleur="text-red-600"
          bg="bg-red-50"
        />
        <StatCard
          icon={MdReceipt}
          titre="Factures en retard"
          valeur={stats?.factures_en_retard || 0}
          couleur="text-orange-600"
          bg="bg-orange-50"
        />
        <StatCard
          icon={MdWater}
          titre="Total Compteurs"
          valeur={stats?.total_compteurs || 0}
          couleur="text-teal-600"
          bg="bg-teal-50"
        />
        <StatCard
          icon={MdWarning}
          titre="Compteurs en panne"
          valeur={stats?.compteurs_en_panne || 0}
          couleur="text-yellow-600"
          bg="bg-yellow-50"
        />
        <StatCard
          icon={MdShowChart}
          titre="Conso. Ce mois"
          valeur={stats?.consommation_mois || 0}
          unite="L"
          couleur="text-indigo-600"
          bg="bg-indigo-50"
        />
      </div>

      {/* ===== GRAPHIQUES CONSOMMATION ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique 1 : 7 derniers jours */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white">
              Consommation – 7 derniers jours
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Volume total d'eau consommé par jour (litres)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats?.consommation_7jours || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="jour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<TooltipPerso />} />
              <Line
                type="monotone"
                dataKey="volume"
                name="Volume (L)"
                stroke="#2E75B6"
                strokeWidth={3}
                dot={{ fill: "#2E75B6", r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique 2 : 6 derniers mois */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white">
              Consommation – 6 derniers mois
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Volume total d'eau consommé par mois (litres)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats?.consommation_6mois || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<TooltipPerso />} />
              <Bar
                dataKey="volume"
                name="Volume (L)"
                fill="#2E75B6"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== RÉSUMÉ RAPIDE ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-800 dark:text-white mb-4">
          Résumé rapide
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-xl">
            <p className="text-3xl font-bold text-blue-600">
              {stats?.total_clients || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Clients
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-xl">
            <p className="text-3xl font-bold text-green-600">
              {stats?.compteurs_actifs || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Compteurs actifs
            </p>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900 rounded-xl">
            <p className="text-3xl font-bold text-red-600">
              {stats?.alertes_en_cours || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Alertes
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900 rounded-xl">
            <p className="text-3xl font-bold text-orange-600">
              {stats?.factures_en_retard || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Factures en retard
            </p>
          </div>
        </div>
      </div>

      {/* ===== STATS PAR ZONE - Super Admin ===== */}
      {user?.role === "super_admin" && stats?.stats_par_zone?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-white mb-6">
            Répartition par zone
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Camembert clients */}
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">
                Clients par zone
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats.stats_par_zone}
                    dataKey="clients"
                    nameKey="zone"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ zone, percent }) =>
                      percent > 0
                        ? `${zone} (${(percent * 100).toFixed(0)}%)`
                        : ""
                    }
                  >
                    {stats.stats_par_zone.map((entry, index) => (
                      <Cell
                        key={entry.zone}
                        fill={COULEURS_ZONES[index % COULEURS_ZONES.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={value => [`${value} clients`]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Camembert consommation par zone */}
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">
                Consommation par zone (litres)
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats.stats_par_zone.filter(z => z.consommation > 0)}
                    dataKey="consommation"
                    nameKey="zone"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ zone, percent }) =>
                      percent > 0
                        ? `${zone} (${(percent * 100).toFixed(0)}%)`
                        : ""
                    }
                  >
                    {stats.stats_par_zone.map((entry, index) => (
                      <Cell
                        key={entry.zone}
                        fill={COULEURS_ZONES[index % COULEURS_ZONES.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={value => [`${value} litres`]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Légende */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
            {stats.stats_par_zone.map((zone, index) => (
              <div
                key={zone.zone}
                className="rounded-xl p-3 text-center"
                style={{
                  backgroundColor:
                    COULEURS_ZONES[index % COULEURS_ZONES.length] + "20",
                }}
              >
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-1"
                  style={{
                    backgroundColor:
                      COULEURS_ZONES[index % COULEURS_ZONES.length],
                  }}
                />
                <p className="text-xs font-semibold text-gray-700 dark:text-white">
                  {zone.zone}
                </p>
                <p
                  className="text-sm font-bold"
                  style={{
                    color: COULEURS_ZONES[index % COULEURS_ZONES.length],
                  }}
                >
                  {zone.clients} clients
                </p>
                <p className="text-xs text-gray-400">{zone.consommation}L</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
