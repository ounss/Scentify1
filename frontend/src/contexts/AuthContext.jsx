// frontend/src/contexts/AuthContext.jsx - CORRECTION FAVORIS URGENTE
import React, { createContext, useContext, useReducer, useEffect } from "react";
import { authAPI } from "../services/api";
import api from "../services/api";

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "LOGIN_SUCCESS":
      localStorage.setItem("token", action.payload.token);
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
      return { ...state, error: action.payload, loading: false };

    case "LOGOUT":
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      return { user: null, token: null, loading: false, error: null };

    case "UPDATE_USER":
      return { ...state, user: { ...state.user, ...action.payload } };

    case "REFRESH_USER_COMPLETE":
      return { ...state, user: action.payload, loading: false };

    // ✅ CORRECTION FAVORIS - STRUCTURE CORRIGÉE
    case "UPDATE_FAVORIS_PARFUMS":
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          favorisParfums: action.payload, // Remplacer complètement la liste
        },
      };

    case "UPDATE_FAVORIS_NOTES":
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          favorisNotes: action.payload, // Remplacer complètement la liste
        },
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

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

  // ✅ VÉRIFIER TOKEN AU CHARGEMENT
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const response = await authAPI.getProfile();

          console.log("✅ Utilisateur chargé:", response.data.username);
          console.log("✅ Favoris chargés:", {
            parfums: response.data.favorisParfums?.length || 0,
            notes: response.data.favorisNotes?.length || 0,
          });

          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { user: response.data, token },
          });
        } catch (error) {
          console.error("❌ Token invalide:", error?.message);
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

  // ✅ ÉCOUTER LES ÉVÉNEMENTS DE MISE À JOUR FAVORIS
  useEffect(() => {
    const handleFavorisUpdate = async () => {
      if (!state.user) return;

      try {
        console.log("🔄 Refresh favoris après changement...");
        const response = await authAPI.getProfile();

        dispatch({
          type: "UPDATE_FAVORIS_PARFUMS",
          payload: response.data.favorisParfums || [],
        });

        console.log(
          "✅ Favoris mis à jour:",
          response.data.favorisParfums?.length || 0
        );
      } catch (error) {
        console.error("❌ Erreur refresh favoris:", error);
      }
    };

    // Écouter les événements favoris
    window.addEventListener("favorisUpdated", handleFavorisUpdate);

    return () => {
      window.removeEventListener("favorisUpdated", handleFavorisUpdate);
    };
  }, [state.user]);

  // ✅ ACTIONS PRINCIPALES
  const login = async (credentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.login(credentials);
      console.log("✅ Login réussie:", response.data.user?.username);

      dispatch({ type: "LOGIN_SUCCESS", payload: response.data });
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
      console.log("✅ Registration réussie:", response.data.user?.username);

      dispatch({ type: "LOGIN_SUCCESS", payload: response.data });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Erreur d'inscription";
      console.error("❌ Erreur register:", message);
      dispatch({ type: "LOGIN_ERROR", payload: message });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    console.log("🚪 Déconnexion");
    dispatch({ type: "LOGOUT" });
  };

  const updateUser = (userData) => {
    console.log("🔄 Mise à jour utilisateur:", userData.username);
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  // ✅ REFRESH USER - CORRECTION
  const refreshUser = async () => {
    if (!state.user) return null;

    try {
      const response = await authAPI.getProfile();
      console.log("🔄 Profil rechargé:", response.data.username);
      dispatch({ type: "REFRESH_USER_COMPLETE", payload: response.data });
      return response.data;
    } catch (error) {
      console.error("❌ Erreur refresh user:", error);
      return null;
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // ✅ VALEURS EXPOSÉES
  const value = {
    // État
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    isAdmin: state.user?.isAdmin || false,

    // Actions principales
    login,
    register,
    logout,
    updateUser,
    refreshUser,
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
