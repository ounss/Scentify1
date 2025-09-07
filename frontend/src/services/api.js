// frontend/src/services/api.js - INTERCEPTEUR CORRIGÉ
import axios from "axios";

const BASE_URL =
  process.env.REACT_APP_API_URL || "https://scentify-perfume.onrender.com/api";

console.log("🔗 Base URL configurée:", BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Intercepteur requête - JWT automatique
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("📡 Token ajouté à la requête:", config.url);
    }
    return config;
  },
  (error) => {
    console.error("❌ Erreur intercepteur requête:", error);
    return Promise.reject(error);
  }
);

// ✅ INTERCEPTEUR RÉPONSE CORRIGÉ - Sans redirection automatique
api.interceptors.response.use(
  (response) => {
    console.log("✅ Réponse API:", response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error("❌ Erreur API:", error.config?.url, error.response?.status);
    console.error("❌ Détails erreur:", error.response?.data);

    // Gestion spécifique des erreurs réseau
    if (error.code === "NETWORK_ERROR" || error.code === "ECONNREFUSED") {
      console.error("🌐 Erreur de connexion réseau - Serveur inaccessible");
    }

    // 🔥 CORRECTION : NE PAS forcer la redirection ici
    // Le AuthContext s'occupera de la gestion de déconnexion
    if (error.response?.status === 401) {
      console.log("🚪 Token invalide/expiré détecté");
      // On supprime juste le token, sans redirection forcée
      localStorage.removeItem("token");
      // La gestion de la déconnexion sera faite par le AuthContext
    }

    return Promise.reject(error);
  }
);

// 🔐 AUTH SERVICES - Endpoints corrigés
export const authAPI = {
  register: (userData) => api.post("/users/register", userData),
  login: (credentials) => api.post("/users/login", credentials),
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

// 🌸 PARFUMS SERVICES
export const parfumsAPI = {
  getAll: (params) => api.get("/parfums", { params }),
  getById: (id) => api.get(`/parfums/${id}`),
  create: (data) => api.post("/parfums", data),
  update: (id, data) => api.put(`/parfums/${id}`, data),
  delete: (id) => api.delete(`/parfums/${id}`),
  search: (query) => api.get(`/parfums/search?q=${encodeURIComponent(query)}`),
};

// 🎵 NOTES SERVICES
export const notesAPI = {
  getAll: (params) => api.get("/notes", { params }),
  getById: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post("/notes", data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

// 👥 USER SERVICES
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

// 🛡️ ADMIN SERVICES
export const adminAPI = {
  // Stats
  getUsersStats: () => api.get("/admin/stats/users"),
  getParfumsStats: () => api.get("/admin/stats/parfums"),

  // Gestion utilisateurs
  getAllUsers: () => api.get("/admin/users"),
  toggleAdminStatus: (id) => api.patch(`/admin/users/${id}/admin`),
  exportUsersCSV: () => api.get("/admin/users/export"),

  // Export parfums
  exportParfumsCSV: () => api.get("/admin/parfums/export"),
};

// 📧 CONTACT SERVICES
export const contactAPI = {
  send: (data) => api.post("/contact/send", data),
  getMessages: () => api.get("/contact"),
  updateMessage: (id, data) => api.patch(`/contact/${id}`, data),
};

export default api;
