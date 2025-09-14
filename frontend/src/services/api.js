// frontend/src/services/api.js - VERSION SANS REDIRECTION AUTOMATIQUE INTEMPESTIVE
import axios from "axios";

const BASE_URL =
  process.env.REACT_APP_API_URL || "https://scentify-perfume.onrender.com/api";

console.log("🔗 Base URL configurée:", BASE_URL);

// ✅ SÉCURISÉ : Configuration pour les cookies httpOnly
const api = axios.create({
  baseURL: "https://scentify-perfume.onrender.com/api",
  withCredentials: true, // CRITIQUE pour envoyer les cookies
  timeout: 15000,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔧 VARIABLES DE CONTRÔLE POUR ÉVITER LES REDIRECTIONS INTEMPESTIVES
let isLoggingOut = false;
let isInitializing = true; // Nouvelle variable pour l'initialisation

// ✅ INTERCEPTOR INTELLIGENT - Évite les redirections lors de l'initialisation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🛡️ PROTECTION MULTIPLE : Ne pas rediriger si :
    // 1. On est en train de se déconnecter
    // 2. On est en phase d'initialisation (checkAuth au démarrage)
    // 3. On est déjà sur une page d'auth
    const currentPath = window.location.pathname;
    const excludedPaths = ["/auth", "/verify-email", "/reset-password", "/"];
    const isCheckAuthCall = error.config?.url?.includes("/users/check-auth");

    if (
      error.response?.status === 401 &&
      !isLoggingOut &&
      !isInitializing &&
      !isCheckAuthCall &&
      !excludedPaths.includes(currentPath)
    ) {
      console.log("🚪 Token cookie expiré, redirection vers /auth");

      // Redirection douce pour mobile
      if (window.location.replace) {
        window.location.replace("/auth");
      } else {
        window.location.href = "/auth";
      }
    }

    return Promise.reject(error);
  }
);

// ✅ AUTH SERVICES SÉCURISÉS avec protection logout ET initialisation
export const authAPI = {
  register: (userData) => api.post("/users/register", userData),
  login: (credentials) => api.post("/users/login", credentials),

  // 🔧 LOGOUT PROTÉGÉ : empêche l'interceptor de rediriger
  logout: async () => {
    isLoggingOut = true; // 🛡️ Désactive l'interceptor temporairement
    try {
      const result = await api.post("/users/logout");
      return result;
    } finally {
      isLoggingOut = false; // 🔄 Réactive l'interceptor après logout
    }
  },

  // 🔧 CHECK AUTH PROTÉGÉ : pour l'initialisation
  checkAuth: async () => {
    try {
      const result = await api.get("/users/check-auth");
      isInitializing = false; // ✅ Fin de l'initialisation si succès
      return result;
    } catch (error) {
      isInitializing = false; // ✅ Fin de l'initialisation même si échec
      throw error;
    }
  },

  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
  forgotPassword: (email) => api.post("/users/forgot-password", { email }),
  resetPassword: (token, password) =>
    api.post("/users/reset-password", { token, password }),
  verifyEmail: (token) => api.get(`/users/verify-email/${token}`),
  resendVerification: (email) =>
    api.post("/users/resend-verification", { email }),
  deleteAccount: () => api.delete("/users/profile"),
};

// ✅ FONCTION PUBLIQUE pour réinitialiser l'état d'initialisation si nécessaire
export const resetInitializationState = () => {
  isInitializing = false;
  console.log("🔄 État d'initialisation réinitialisé");
};

// ✅ PARFUMS SERVICES (exactement votre version)
export const parfumsAPI = {
  getAll: (params) => api.get("/parfums", { params }),
  getById: (id) => api.get(`/parfums/${id}`),
  getSimilar: (id) => api.get(`/parfums/${id}/similar`),
  create: (data) => api.post("/parfums", data),
  update: (id, data) => api.put(`/parfums/${id}`, data),
  delete: (id) => api.delete(`/parfums/${id}`),
  search: (query) => api.get(`/parfums/search?q=${encodeURIComponent(query)}`),

  // Recherche par notes
  getByNotes: (noteIds) => {
    const notesParam = Array.isArray(noteIds) ? noteIds.join(",") : noteIds;
    return api.get("/parfums", { params: { notes: notesParam } });
  },
  getByNote: (noteId) => api.get(`/parfums/note/${noteId}`),
};

// ✅ NOTES SERVICES (exactement votre version)
export const notesAPI = {
  getAll: (params) => api.get("/notes", { params }),
  getById: (id) => api.get(`/notes/${id}`),
  getFamilies: () => api.get("/notes/families"),
  search: (query) => api.get("/notes/search", { params: { q: query } }),
  create: (data) => api.post("/notes", data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

// ✅ USER SERVICES (exactement votre version)
export const userAPI = {
  // Favoris
  getFavorites: () => api.get("/users/favorites"),
  addFavoriteParfum: (id) => api.post(`/users/favorites/parfum/${id}`),
  removeFavoriteParfum: (id) => api.delete(`/users/favorites/parfum/${id}`),
  addFavoriteNote: (id) => api.post(`/users/favorites/note/${id}`),
  removeFavoriteNote: (id) => api.delete(`/users/favorites/note/${id}`),

  // Historique
  getHistory: () => api.get("/users/history"),
  addToHistory: (id) => api.post(`/users/history/${id}`),
  clearHistory: () => api.delete("/users/history"),
};

// ✅ ADMIN SERVICES (exactement votre version)
export const adminAPI = {
  // Stats
  getUsersStats: () => api.get("/admin/stats/users"),
  getParfumsStats: () => api.get("/admin/stats/parfums"),

  // Gestion utilisateurs
  getAllUsers: () => api.get("/admin/users"),
  toggleAdminStatus: (id) => api.patch(`/admin/users/${id}/admin`),
  exportUsersCSV: () =>
    api.get("/admin/users/export", { responseType: "blob" }),

  // Export parfums
  exportParfumsCSV: () =>
    api.get("/admin/parfums/export", { responseType: "blob" }),
};

// ✅ CONTACT SERVICES (exactement votre solution hybride)
export const contactAPI = {
  // ✅ Utilise fetch direct pour éviter les problèmes (votre solution)
  send: async (data) => {
    const response = await fetch(`${BASE_URL}/contact/send`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }

    return { data: await response.json() };
  },

  // Les routes admin utilisent axios normalement (avec cookie maintenant)
  getMessages: () => api.get("/contact"),
  updateMessage: (id, data) => api.patch(`/contact/${id}`, data),
};

// ✅ UPLOAD SERVICES (exactement votre version)
export const uploadAPI = {
  uploadParfumImage: (file) => {
    const formData = new FormData();
    formData.append("photo", file);
    return api.post("/parfums/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ✅ TEST SERVICES (exactement votre version)
export const testAPI = {
  health: () => api.get("/health"),
  testAuth: () => api.get("/users/profile"),
};

// ✅ ALIASES pour compatibilité (exactement votre version)
export const parfumAPI = parfumsAPI; // Alias
export const noteAPI = notesAPI; // Alias
export const favoritesAPI = userAPI; // Alias pour favoris
export const historyAPI = userAPI; // Alias pour historique

export default api;
