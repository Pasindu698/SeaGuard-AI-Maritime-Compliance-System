import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getMyProfile,
  loginUser,
} from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem("seaguard_token")
  );

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (currentToken) => {
    try {
      const profile = await getMyProfile(currentToken);
      setUser(profile);
    } catch (error) {
      console.error("Authentication error:", error);

      localStorage.removeItem("seaguard_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadProfile(token);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const data = await loginUser(username, password);

    if (!data.access_token) {
      throw new Error("Authentication token was not received.");
    }

    localStorage.setItem(
      "seaguard_token",
      data.access_token
    );

    setToken(data.access_token);

    const profile = await getMyProfile(data.access_token);
    setUser(profile);

    return profile;
  };

  const logout = () => {
    localStorage.removeItem("seaguard_token");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = Boolean(token && user);

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        hasRole,
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
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}