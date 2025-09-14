// frontend/src/contexts/AuthContext.jsx - VERSION SANS REDIRECTION AUTO
import React, { createContext, useContext, useReducer, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: null,
        loading: false,
        error: null,
      };

    case "LOGIN_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "LOGOUT":
      return { user: null, token: null, loading: false, error: null };

    case "UPDATE_USER":
      return { ...state, user: { ...state.user, ...action.payload } };

    case "REFRESH_USER_COMPLETE":
      return { ...state, user: action.payload, loading: false };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "UPDATE_FAVORIS_PARFUMS":
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          favorisParfums: action.payload,
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
    loading: true, // Commence en loading
    error: null,
  });

  // ✅ INITIALISATION SANS REDIRECTION AUTOMATIQUE
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        console.log("🔄 Vérification de l'authentification via cookie...");

        // ⏱️ Timeout plus court pour éviter les blocages
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 5000)
        );

        const authPromise = authAPI.checkAuth();
        const response = await Promise.race([authPromise, timeoutPromise]);

        if (!isMounted) return;

        console.log(
          "✅ Utilisateur connecté via cookie:",
          response.data.user.username
        );
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user: response.data.user },
        });
      } catch (error) {
        if (!isMounted) return;

        // 🔇 Logging silencieux pour les erreurs normales
        if (error.response?.status === 401) {
          console.log("ℹ️ Utilisateur non connecté (normal)");
        } else if (error.message === "Timeout") {
          console.log("⏱️ Timeout de vérification auth (normal sur mobile)");
        } else {
          console.error("❌ Erreur initAuth:", error.message);
        }

        // ✅ IMPORTANT : Toujours définir loading à false
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    // 🚀 Lancer l'initialisation
    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // ✅ FONCTION LOGIN (inchangée)
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

  // ✅ FONCTION REGISTER (inchangée)
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

  // ✅ FONCTION LOGOUT - AUCUNE REDIRECTION AUTOMATIQUE
  const logout = async () => {
    try {
      await authAPI.logout();
      console.log("✅ Déconnexion réussie (cookie supprimé)");
    } catch (error) {
      console.error("❌ Erreur lors du logout:", error);
      // Continuer même si l'appel API échoue
    }

    // 🔄 Mettre à jour l'état local
    dispatch({ type: "LOGOUT" });

    // ✅ RETOURNER STATUT POUR LE COMPOSANT
    return { success: true };
  };

  // ✅ FONCTION UPDATE USER (inchangée)
  const updateUser = (userData) => {
    console.log("🔄 Mise à jour utilisateur:", userData.username);
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  // ✅ FONCTION REFRESH USER SANS REDIRECTION AUTO
  const refreshUser = async () => {
    if (!state.user) return null;

    try {
      const response = await authAPI.getProfile();
      console.log("🔄 Profil rechargé:", response.data.user.username);
      dispatch({ type: "REFRESH_USER_COMPLETE", payload: response.data.user });
      return response.data.user;
    } catch (error) {
      console.error("❌ Erreur refresh user:", error);

      // ✅ Si erreur 401, déconnecter silencieusement (pas de redirection auto)
      if (error.response?.status === 401) {
        console.log("🚪 Token expiré lors du refresh, déconnexion silencieuse");
        dispatch({ type: "LOGOUT" });
      }
      return null;
    }
  };

  // ✅ FONCTION CLEAR ERROR (inchangée)
  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // ✅ FONCTIONS PASSWORD (inchangées)
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

      return { success: false, error: message };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const resetPassword = async (token, password) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await authAPI.resetPassword(token, password);

      console.log("✅ Mot de passe réinitialisé avec succès");

      // ✅ Si la réponse contient un utilisateur, on le connecte automatiquement
      if (response.data.user) {
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user: response.data.user },
        });
      }

      return {
        success: true,
        message:
          response.data.message || "Mot de passe réinitialisé avec succès !",
        autoLogin: !!response.data.user,
      };
    } catch (error) {
      console.error("❌ Erreur resetPassword:", error);
      const message =
        error.response?.data?.message || "Erreur lors de la réinitialisation";
      dispatch({ type: "LOGIN_ERROR", payload: message });

      return { success: false, error: message };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

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

      return { success: false, error: message };
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
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
    needsVerification: state.error?.includes("vérifier"),

    // Actions principales
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    clearError,

    // Actions password
    forgotPassword,
    resetPassword,
    resendVerificationEmail,
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
