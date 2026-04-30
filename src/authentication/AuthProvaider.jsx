import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

// ── Hardcoded users (API কাজ না করলে এখান থেকে login হবে) ──────────────
const MOCK_USERS = [
  {
    username: "admin",
    password: "123456",
    data: { id: 1, name: "Admin User", role: "admin", username: "admin" },
  },
  {
    username: "user",
    password: "user123",
    data: { id: 2, name: "Regular User", role: "user", username: "user" },
  },
];

const SESSION_KEY = "auth_user";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Page reload এ localStorage থেকে session restore করো ────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────
  const login = async (username, password) => {
    const match = MOCK_USERS.find(
      (u) => u.username === username && u.password === password
    );

    if (match) {
      setUser(match.data);
      localStorage.setItem(SESSION_KEY, JSON.stringify(match.data));
      return true;
    }

    return false;
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};