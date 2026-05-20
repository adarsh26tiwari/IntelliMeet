import { createContext, useContext, useEffect, useState } from "react";
import api from "../service/api";
import { API_ENDPOINTS } from "../utils/constants";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get(API_ENDPOINTS.AUTH.ME);
        setUser(response.data?.data?.user);
      } catch (error) {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const register = async (name, email, password) => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, {
        name,
        email,
        password,
      });
      const { user, token } = response.data.data;
      localStorage.setItem("token", token);
      setUser(user);
      return { success: true, user };
    } catch (err) {
      const raw = err.response?.data?.error;
      const errorMessage = Array.isArray(raw) ? raw[0] : raw || "Registration failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
      const { user, token } = response.data.data;
      localStorage.setItem("token", token);
      setUser(user);
      return { success: true, user };
    } catch (err) {
      const raw = err.response?.data?.error;
      const errorMessage = Array.isArray(raw) ? raw[0] : raw || "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    setError,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;