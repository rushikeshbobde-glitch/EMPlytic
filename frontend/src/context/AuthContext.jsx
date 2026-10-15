import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || localStorage.getItem("access_token") || null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const currentToken = localStorage.getItem("token") || localStorage.getItem("access_token");
      if (!currentToken) {
        setLoading(false);
        return;
      }
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${apiUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          const userObj = data.user || data;
          setUser(userObj);
          localStorage.setItem("user", JSON.stringify(userObj));
        } else if (res.status === 401) {
          logout();
        }
      } catch (err) {
        console.warn("Backend unreachable during auth check, maintaining local session", err);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("token", jwtToken);
    localStorage.setItem("access_token", jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("user_role", userData.role || "hr");
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_role");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
