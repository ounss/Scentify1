// frontend/src/contexts/AuthContext.jsx - CORRECTION FAVORIS ET ÉVÉNEMENTS
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

    // ✅ GESTION FAVORIS PARFUMS
    case "ADD_FAVORI_PARFUM":
      if (!state.user) return state;
      const currentFavorisParfums = state.user.favorisParfums || [];
      if (
        currentFavorisParfums.some(
          (fav) => (typeof fav === "string" ? fav : fav._id) === action.payload
        )
      ) {
        return state; // Déjà en favoris
      }
      return {
        ...state,
        user: {
          ...state.user,
          favorisParfums: [...currentFavorisParfums, action.payload],
        },
      };

    case "REMOVE_FAVORI_PARFUM":
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          favorisParfums: (state.user.favorisParfums || []).filter(
            (fav) =>
              (typeof fav === "string" ? fav : fav._id) !== action.payload
          ),
        },
      };

    // ✅ GESTION FAVORIS NOTES
    case "ADD_FAVORI_NOTE":
      if (!state.user) return state;
      const currentFavorisNotes = state.user.favorisNotes || [];
      if (
        currentFavorisNotes.some(
          (fav) => (typeof fav === "string" ? fav : fav._id) === action.payload
        )
      ) {
        return state; // Déjà en favoris
      }
      return {
        ...state,
        user: {
          ...state.user,
          favorisNotes: [...currentFavorisNotes, action.payload],
        },
      };

    case "REMOVE_FAVORI_NOTE":
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          favorisNotes: (state.user.favorisNotes || []).filter(
            (fav) =>
              (typeof fav === "string" ? fav : fav._id) !== action.payload
          ),
        },
      };

    // ✅ GESTION HISTORIQUE
    case "ADD_TO_HISTORY":
      if (!state.user) return state;

      const newHistoryItem = {
        parfum: action.payload.parfum,
        dateVisite: new Date().toISOString(),
      };

      const currentHistory = state.user.historique || [];

      // Supprimer l'entrée existante si elle existe
      const filteredHistory = currentHistory.filter((h) => {
        const historyParfumId =
          typeof h.parfum === "string" ? h.parfum : h.parfum?._id;
        const newParfumId =
          typeof newHistoryItem.parfum === "string"
            ? newHistoryItem.parfum
            : newHistoryItem.parfum?._id;
        return historyParfumId !== newParfumId;
      });

      return {
        ...state,
        user: {
          ...state.user,
          historique: [newHistoryItem, ...filteredHistory].slice(0, 50), // Limiter à 50
        },
      };

    case "CLEAR_HISTORY":
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          historique: [],
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

          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { user: response.data, token },
          });
        } catch (error) {
          console.error("❌ Token invalide:", error.message);
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

  // ✅ ÉCOUTER LES ÉVÉNEMENTS DE MISE À JOUR
  useEffect(() => {
    // Événement favoris parfums
    const handleFavorisUpdate = (event) => {
      const { parfumId, action } = event.detail;

      if (action === "add") {
        dispatch({ type: "ADD_FAVORI_PARFUM", payload: parfumId });
      } else if (action === "remove") {
        dispatch({ type: "REMOVE_FAVORI_PARFUM", payload: parfumId });
      }
    };

    // Événement favoris notes
    const handleNotesUpdate = (event) => {
      const { noteId, action } = event.detail;

      if (action === "add") {
        dispatch({ type: "ADD_FAVORI_NOTE", payload: noteId });
      } else if (action === "remove") {
        dispatch({ type: "REMOVE_FAVORI_NOTE", payload: noteId });
      }
    };

    // Événement historique
    const handleHistoryUpdate = (event) => {
      const { parfum } = event.detail;
      dispatch({ type: "ADD_TO_HISTORY", payload: { parfum } });
    };

    // Ajouter les listeners
    window.addEventListener("favorisUpdated", handleFavorisUpdate);
    window.addEventListener("notesUpdated", handleNotesUpdate);
    window.addEventListener("historyUpdated", handleHistoryUpdate);

    // Nettoyage
    return () => {
      window.removeEventListener("favorisUpdated", handleFavorisUpdate);
      window.removeEventListener("notesUpdated", handleNotesUpdate);
      window.removeEventListener("historyUpdated", handleHistoryUpdate);
    };
  }, []);

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

  // ✅ REFRESH USER - À utiliser avec parcimonie
  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile();
      console.log("🔄 Profil rechargé:", response.data.username);
      dispatch({ type: "REFRESH_USER", payload: response.data });
      return response.data;
    } catch (error) {
      console.error("❌ Erreur refresh user:", error);
      return null;
    }
  };

  // ✅ ACTIONS FAVORIS (pour utilisation directe si besoin)
  const addFavoriParfum = (parfumId) => {
    dispatch({ type: "ADD_FAVORI_PARFUM", payload: parfumId });
  };

  const removeFavoriParfum = (parfumId) => {
    dispatch({ type: "REMOVE_FAVORI_PARFUM", payload: parfumId });
  };

  const addFavoriNote = (noteId) => {
    dispatch({ type: "ADD_FAVORI_NOTE", payload: noteId });
  };

  const removeFavoriNote = (noteId) => {
    dispatch({ type: "REMOVE_FAVORI_NOTE", payload: noteId });
  };

  const addToHistory = (parfum) => {
    dispatch({ type: "ADD_TO_HISTORY", payload: { parfum } });
  };

  const clearHistory = () => {
    dispatch({ type: "CLEAR_HISTORY" });
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

    // Actions favoris et historique
    addFavoriParfum,
    removeFavoriParfum,
    addFavoriNote,
    removeFavoriNote,
    addToHistory,
    clearHistory,
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
