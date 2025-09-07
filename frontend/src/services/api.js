// frontend/src/services/api.js - VERSION 100% FONCTIONNELLE
import axios from "axios";

// ✅ Configuration de base cohérente
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

// ✅ INTERCEPTEUR REQUÊTE SÉLECTIF - Token uniquement pour les routes protégées
api.interceptors.request.use(
  (config) => {
    // ✅ Routes publiques qui ne doivent PAS avoir de token
    const publicRoutes = [
      "/contact/send",
      "/users/register",
      "/users/login",
      "/users/forgot-password",
      "/users/reset-password",
      "/users/verify-email",
      "/users/resend-verification",
      "/parfums",
      "/notes",
      "/health",
    ];

    // Vérifier si l'URL correspond à une route publique
    const isPublicRoute = publicRoutes.some(
      (route) =>
        config.url &&
        (config.url.includes(route) || config.url.startsWith(route))
    );

    // ✅ Ajouter le token SEULEMENT si ce n'est pas une route publique
    if (!isPublicRoute) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("📡 Token ajouté à la requête:", config.url);
      }
    } else {
      console.log("🌐 Route publique, pas de token:", config.url);
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

// 🔐 AUTH SERVICES - Endpoints cohérents avec le backend
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

  // ✅ FONCTION LOGOUT AJOUTÉE
  logout: () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    return Promise.resolve();
  },
};

// 🌸 PARFUMS SERVICES - Noms cohérents avec votre backend
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

// 🎵 NOTES SERVICES
export const notesAPI = {
  getAll: (params) => api.get("/notes", { params }),
  getById: (id) => api.get(`/notes/${id}`),
  getFamilies: () => api.get("/notes/families"),
  search: (query) => api.get("/notes/search", { params: { q: query } }),
  create: (data) => api.post("/notes", data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

// 👥 USER SERVICES - Favoris et historique
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
  exportUsersCSV: () =>
    api.get("/admin/users/export", { responseType: "blob" }),

  // Export parfums
  exportParfumsCSV: () =>
    api.get("/admin/parfums/export", { responseType: "blob" }),
};

// 📧 CONTACT SERVICES - SOLUTION HYBRIDE pour éviter les problèmes de token
export const contactAPI = {
  // ✅ Utilise fetch direct pour éviter l'intercepteur axios
  send: async (data) => {
    const response = await fetch(`${BASE_URL}/contact/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Pas d'Authorization header pour cette route publique
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }

    return { data: await response.json() };
  },

  // Les routes admin utilisent axios normalement (avec token)
  getMessages: () => api.get("/contact"),
  updateMessage: (id, data) => api.patch(`/contact/${id}`, data),
};

// 📷 UPLOAD SERVICES
export const uploadAPI = {
  uploadParfumImage: (file) => {
    const formData = new FormData();
    formData.append("photo", file);
    return api.post("/parfums/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ✅ TEST SERVICES
export const testAPI = {
  health: () => api.get("/health"),
  testAuth: () => api.get("/users/profile"),
};

// ✅ ALIASES pour compatibilité (éviter les erreurs de références)
export const parfumAPI = parfumsAPI; // Alias
export const noteAPI = notesAPI; // Alias
export const favoritesAPI = userAPI; // Alias pour favoris
export const historyAPI = userAPI; // Alias pour historique

export default api;
