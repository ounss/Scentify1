// frontend/src/contexts/AuthContext.jsx - CORRECTION FAVORIS
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

    case "REFRESH_USER":
      return { ...state, user: action.payload };

    // ✅ NOUVEAUX ACTIONS POUR FAVORIS OPTIMISÉES
    case "ADD_FAVORI_PARFUM":
      return {
        ...state,
        user: {
          ...state.user,
          favorisParfums: [
            ...(state.user?.favorisParfums || []),
            action.payload,
          ],
        },
      };

    case "REMOVE_FAVORI_PARFUM":
      return {
        ...state,
        user: {
          ...state.user,
          favorisParfums: (state.user?.favorisParfums || []).filter(
            (fav) =>
              (typeof fav === "string" ? fav : fav._id) !== action.payload
          ),
        },
      };

    case "ADD_FAVORI_NOTE":
      return {
        ...state,
        user: {
          ...state.user,
          favorisNotes: [...(state.user?.favorisNotes || []), action.payload],
        },
      };

    case "REMOVE_FAVORI_NOTE":
      return {
        ...state,
        user: {
          ...state.user,
          favorisNotes: (state.user?.favorisNotes || []).filter(
            (fav) =>
              (typeof fav === "string" ? fav : fav._id) !== action.payload
          ),
        },
      };

    case "ADD_TO_HISTORY":
      const newHistoryItem = {
        parfum: action.payload.parfum,
        dateVisite: new Date().toISOString(),
      };

      // Supprimer l'existant et ajouter au début
      const filteredHistory = (state.user?.historique || []).filter(
        (h) => h.parfum._id !== action.payload.parfum._id
      );

      return {
        ...state,
        user: {
          ...state.user,
          historique: [newHistoryItem, ...filteredHistory].slice(0, 50), // Limiter à 50
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

  // ✅ Vérifier le token au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const response = await authAPI.getProfile();

          console.log("✅ Utilisateur chargé:", response.data);

          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { user: response.data, token },
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

  // ✅ ÉCOUTER LES ÉVÉNEMENTS FAVORIS POUR MISE À JOUR OPTIMISÉE
  useEffect(() => {
    const handleFavorisUpdate = (event) => {
      const { parfumId, action } = event.detail;

      if (action === "add") {
        dispatch({ type: "ADD_FAVORI_PARFUM", payload: parfumId });
      } else if (action === "remove") {
        dispatch({ type: "REMOVE_FAVORI_PARFUM", payload: parfumId });
      }
    };

    const handleHistoryUpdate = (event) => {
      const { parfum } = event.detail;
      dispatch({ type: "ADD_TO_HISTORY", payload: { parfum } });
    };

    window.addEventListener("favorisUpdated", handleFavorisUpdate);
    window.addEventListener("historyUpdated", handleHistoryUpdate);

    return () => {
      window.removeEventListener("favorisUpdated", handleFavorisUpdate);
      window.removeEventListener("historyUpdated", handleHistoryUpdate);
    };
  }, []);

  // ✅ ACTIONS
  const login = async (credentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.login(credentials);
      console.log("✅ Login réussie:", response.data);
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
      console.log("✅ Registration réussie:", response.data);
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
    delete api.defaults.headers.common["Authorization"];
    dispatch({ type: "LOGOUT" });
  };

  const updateUser = (userData) => {
    console.log("🔄 Mise à jour utilisateur:", userData);
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  // ✅ FONCTION REFRESH OPTIMISÉE - Utilisée seulement quand nécessaire
  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile();
      console.log("🔄 Profil rechargé:", response.data);
      dispatch({ type: "REFRESH_USER", payload: response.data });
      return response.data;
    } catch (error) {
      console.error("❌ Erreur refresh user:", error);
      // ✅ Ne pas déconnecter automatiquement sur erreur refresh
      return null;
    }
  };

  // ✅ NOUVELLES FONCTIONS OPTIMISÉES POUR FAVORIS
  const addFavoriParfum = (parfumId) => {
    dispatch({ type: "ADD_FAVORI_PARFUM", payload: parfumId });
  };

  const removeFavoriParfum = (parfumId) => {
    dispatch({ type: "REMOVE_FAVORI_PARFUM", payload: parfumId });
  };

  const addToHistory = (parfum) => {
    dispatch({ type: "ADD_TO_HISTORY", payload: { parfum } });
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

    // Actions
    login,
    register,
    logout,
    updateUser,
    refreshUser,

    // ✅ Nouvelles actions optimisées
    addFavoriParfum,
    removeFavoriParfum,
    addToHistory,
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
