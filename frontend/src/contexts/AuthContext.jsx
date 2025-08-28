import React, { createContext, useContext, useReducer, useEffect } from "react";
import { authAPI } from "../services/api";
import api from "../services/api";

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "LOGIN_SUCCESS":
      localStorage.setItem("token", action.payload.token);
      // ✅ Configure axios immédiatement
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${action.payload.token}`;
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case "LOGIN_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case "LOGOUT":
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      return {
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case "REFRESH_USER": // ✅ Nouveau pour recharger les données utilisateur
      return {
        ...state,
        user: action.payload,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  loading: true,
  error: null,
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ✅ Vérifier le token au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          // Configurer axios avec le token avant l'appel
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const response = await authAPI.getProfile();

          console.log("✅ Utilisateur chargé:", response.data); // Debug

          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              user: response.data,
              token,
            },
          });
        } catch (error) {
          console.error("❌ Token invalide:", error);
          localStorage.removeItem("token");
          delete api.defaults.headers.common["Authorization"];
          dispatch({ type: "LOGOUT" });
        }
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    checkAuth();
  }, []);

  // ✅ Actions
  const login = async (credentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.login(credentials);

      console.log("✅ Login réussie:", response.data); // Debug

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: response.data,
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Erreur de connexion";
      console.error("❌ Erreur login:", message);
      dispatch({ type: "LOGIN_ERROR", payload: message });
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.register(userData);

      console.log("✅ Registration réussie:", response.data); // Debug

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: response.data,
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Erreur d'inscription";
      console.error("❌ Erreur register:", message);
      dispatch({ type: "LOGIN_ERROR", payload: message });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    console.log("🚪 Déconnexion"); // Debug
    delete api.defaults.headers.common["Authorization"];
    dispatch({ type: "LOGOUT" });
  };

  const updateUser = (userData) => {
    console.log("🔄 Mise à jour utilisateur:", userData); // Debug
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  // ✅ Nouvelle fonction pour recharger le profil complet
  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile();
      console.log("🔄 Profil rechargé:", response.data); // Debug
      dispatch({ type: "REFRESH_USER", payload: response.data });
      return response.data;
    } catch (error) {
      console.error("❌ Erreur refresh user:", error);
      return null;
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    isAdmin: state.user?.isAdmin || false,
    login,
    register,
    logout,
    updateUser,
    refreshUser, // ✅ Nouvelle fonction
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
