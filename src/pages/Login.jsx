import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.jpg";
import bgLogin from "../assets/bg-login.jfif";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [loading, setLoading] = useState(false);
  const { connexion } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setErreur("");

    try {
      const role = await connexion(username, password);
      if (role === "client") {
        navigate("/client/dashboard");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (error) {
      setErreur("Identifiants incorrects. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${bgLogin})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay sombre pour lisibilité */}
      <div className="absolute inset-0 bg-black opacity-50" />

      {/* Formulaire transparent */}
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl p-8"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(0px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="Logo"
            className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-white"
          />
          <h1 className="text-3xl font-bold text-white">Smart Ndiyam</h1>
          <p className="text-white text-opacity-80 text-sm mt-1">
            Système Intelligent de Gestion d'Eau IoT
          </p>
        </div>

        {/* Message d'erreur */}
        {erreur && (
          <div className="bg-red-500 bg-opacity-80 text-white border border-red-300 rounded-lg p-3 mb-4 text-sm">
            {erreur}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Entrez votre username"
              required
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white transition text-white placeholder-white placeholder-opacity-70"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              required
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white transition text-white placeholder-white placeholder-opacity-70"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
              }}
            />
          </div>

          {/* Bouton connexion */}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2 mt-2"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              color: "#1F4E79",
            }}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-white text-opacity-70 text-xs mt-6">
          Smart Ndiyam © 2026 - Sénégal
        </p>
      </div>
    </div>
  );
}
