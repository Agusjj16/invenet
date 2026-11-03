import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Consultar si existe una sesión activa.
  const fetchUser = async () => {
    try {
      const response = await api.get("/api/user");
      setUser(response.data);

      return response.data;
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  // Recuperar la sesión cuando se carga React.
  useEffect(() => {
    let activo = true;

    const verificarSesion = async () => {
      try {
        const response = await api.get("/api/user");

        if (activo) {
          setUser(response.data);
        }
      } catch {
        if (activo) {
          setUser(null);
        }
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    };

    verificarSesion();

    return () => {
      activo = false;
    };
  }, []);

  // Iniciar sesión.
  const login = async (email, password) => {
    await api.get("/sanctum/csrf-cookie");

    await api.post("/api/login", {
      email,
      password,
    });

    return await fetchUser();
  };

  // Cerrar sesión.
  const logout = async () => {
    await api.post("/api/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider"
    );
  }

  return context;
}