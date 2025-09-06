// frontend/src/contexts/AuthContext.jsx - VERSION COMPLÈTE
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

    case "CLEAR_ERROR":
      return { ...state, error: null };

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
          favorisNotes: action.payload,
        },
      };

    default:
      return state;
  }
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  // ✅ Initialisation au chargement
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        try {
          const response = await authAPI.getProfile();
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { token, user: response.data },
          });
        } catch (error) {
          console.error("❌ Token invalide, suppression:", error);
          localStorage.removeItem("token");
          delete api.defaults.headers.common["Authorization"];
          dispatch({ type: "SET_LOADING", payload: false });
        }
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    initAuth();
  }, []);

  // ✅ FONCTION LOGIN
  const login = async (credentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.login(credentials);
      console.log("✅ Login réussi:", response.data.user?.username);

      // Vérifier si l'email est vérifié
      if (!response.data.user?.isVerified) {
        dispatch({ type: "SET_LOADING", payload: false });
        return {
          success: false,
          needsVerification: true,
          error: "Veuillez vérifier votre email avant de vous connecter.",
        };
      }

      dispatch({ type: "LOGIN_SUCCESS", payload: response.data });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Erreur de connexion";
      console.error("❌ Erreur login:", message);
      dispatch({ type: "LOGIN_ERROR", payload: message });

      // Cas spécial : email non vérifié
      if (error.response?.data?.needsVerification) {
        return { success: false, needsVerification: true, error: message };
      }

      return { success: false, error: message };
    }
  };

  // ✅ FONCTION REGISTER
  const register = async (userData) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.register(userData);
      console.log("✅ Registration réussie:", response.data.user?.username);

      // Si needsVerification est true, ne pas connecter automatiquement
      if (response.data.user && !response.data.user.isVerified) {
        dispatch({ type: "SET_LOADING", payload: false });
        return {
          success: true,
          needsVerification: true,
          message:
            response.data.message || "Compte créé ! Vérifiez votre email.",
        };
      }

      dispatch({ type: "LOGIN_SUCCESS", payload: response.data });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Erreur d'inscription";
      console.error("❌ Erreur register:", message);
      dispatch({ type: "LOGIN_ERROR", payload: message });
      return { success: false, error: message };
    }
  };

  // ✅ FONCTION LOGOUT
  const logout = () => {
    console.log("🚪 Déconnexion");
    dispatch({ type: "LOGOUT" });
  };

  // ✅ FONCTION UPDATE USER
  const updateUser = (userData) => {
    console.log("🔄 Mise à jour utilisateur:", userData.username);
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  // ✅ FONCTION REFRESH USER
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

  // ✅ FONCTION CLEAR ERROR
  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // 🔐 ========== NOUVELLES FONCTIONS PASSWORD ==========

  // ✅ FORGOT PASSWORD - Demander la réinitialisation
  const forgotPassword = async (email) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.forgotPassword(email);

      console.log("✅ Email de reset envoyé à:", email);
      return {
        success: true,
        message: response.data.message || "Email de réinitialisation envoyé !",
      };
    } catch (error) {
      console.error("❌ Erreur forgotPassword:", error);
      const message =
        error.response?.data?.message || "Erreur lors de l'envoi de l'email";
      dispatch({ type: "LOGIN_ERROR", payload: message });

      return {
        success: false,
        error: message,
      };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // ✅ RESET PASSWORD - Définir le nouveau mot de passe
  const resetPassword = async (token, password) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.resetPassword(token, password);

      console.log("✅ Mot de passe réinitialisé avec succès");
      return {
        success: true,
        message:
          response.data.message || "Mot de passe réinitialisé avec succès !",
      };
    } catch (error) {
      console.error("❌ Erreur resetPassword:", error);
      const message =
        error.response?.data?.message || "Erreur lors de la réinitialisation";
      dispatch({ type: "LOGIN_ERROR", payload: message });

      return {
        success: false,
        error: message,
      };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // ✅ RESEND VERIFICATION - Renvoyer l'email de vérification
  const resendVerificationEmail = async (email) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.resendVerification(email);

      console.log("✅ Email de vérification renvoyé à:", email);
      return {
        success: true,
        message: response.data.message || "Email de vérification renvoyé !",
      };
    } catch (error) {
      console.error("❌ Erreur resendVerification:", error);
      const message =
        error.response?.data?.message || "Erreur lors du renvoi de l'email";
      dispatch({ type: "LOGIN_ERROR", payload: message });

      return {
        success: false,
        error: message,
      };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // ✅ VALEURS EXPOSÉES - TOUTES LES FONCTIONS
  const value = {
    // État
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    isAdmin: state.user?.isAdmin || false,
    needsVerification: state.error?.includes("vérifier"), // Helper pour détecter si verification requise

    // Actions principales
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    clearError,

    // ✅ NOUVELLES ACTIONS PASSWORD
    forgotPassword, // Demander reset (depuis /auth)
    resetPassword, // Définir nouveau mot de passe (depuis /reset-password)
    resendVerificationEmail, // Renvoyer email de vérification (depuis /auth)
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
