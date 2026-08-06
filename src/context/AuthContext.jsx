import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData));
      // Rafraîchir les infos depuis l'API
      refreshProfil();
    }
    setLoading(false);
  }, []);

  // Rafraîchir le profil depuis l'API
  const refreshProfil = async () => {
    try {
      const response = await authService.profil();
      const data = response.data;
      const userData = {
        id: data.id,
        nom: `${data.first_name} ${data.last_name}`.trim() || data.username,
        username: data.username,
        role: data.role,
        zone: data.zone,
        email: data.email,
        telephone: data.telephone,
        photo_url: data.photo_url,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Erreur refresh profil:", error);
    }
  };

  // Appliquer thème
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const connexion = async (username, password) => {
    const response = await authService.connexion({ username, password });
    const data = response.data;

    const userData = {
      id: data.id,
      nom: data.nom,
      username: data.username,
      role: data.role,
      zone: data.zone,
      email: data.email,
      telephone: data.telephone,
      photo_url: data.photo_url, // ← photo depuis API
    };

    localStorage.setItem("token", data.token);
    localStorage.setItem("refresh", data.refresh);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return data.role;
  };

  const deconnexion = async () => {
    try {
      const refresh = localStorage.getItem("refresh");
      await authService.deconnexion(refresh);
    } catch (e) {}
    localStorage.clear();
    setUser(null);
  };

  const updatePhoto = photoUrl => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    userData.photo_url = photoUrl;
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(prev => ({ ...prev, photo_url: photoUrl }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        connexion,
        deconnexion,
        loading,
        theme,
        toggleTheme,
        updatePhoto,
        refreshProfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
