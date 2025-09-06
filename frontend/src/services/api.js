// frontend/src/services/api.js - VERSION CORRIGÉE avec getSimilar
import axios from "axios";

// Configuration de base
const API_BASE_URL = 
  process.env.NODE_ENV === "production"
    ? "https://scentify-perfume.onrender.com/api"
    : "http://localhost:10000/api";

// Instance Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les réponses et erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

// 🔐 AUTH SERVICES
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  logout: () => {
    localStorage.removeItem("token");
    return Promise.resolve();
  },
  getCurrentUser: () => api.get("/users/me"),
  updateProfile: (data) => api.put("/users/me", data),
  changePassword: (data) => api.put("/users/me/password", data),
  deleteAccount: () => api.delete("/users/me"),
  forgotPassword: (email) => api.post("/users/forgot-password", { email }),
  resetPassword: (token, password) => api.post("/users/reset-password", { token, password }),
  resendVerification: (email) => api.post("/users/resend-verification", { email }),
  verifyEmail: (token) => api.get(`/users/verify-email/${token}`),
};

// ✅ NOUVEAU : API pour contact
export const contactAPI = {
  sendMessage: (contactData) => api.post("/contact/send", contactData),
  getMessages: () => api.get("/contact"), // Admin only
  updateMessage: (id, data) => api.patch(`/contact/${id}`, data), // Admin only
};

// 🌸 PARFUM SERVICES (VERSION CORRIGÉE avec getSimilar)
export const parfumAPI = {
  getAll: (params = {}) => api.get("/parfums", { params }),
  getById: (id) => api.get(`/parfums/${id}`),

  // 🔧 FIX: Ajout de la fonction getSimilar manquante
  getSimilar: (id) => api.get(`/parfums/${id}/similar`),

  create: (data) => api.post("/parfums", data),
  update: (id, data) => api.put(`/parfums/${id}`, data),
  delete: (id) => api.delete(`/parfums/${id}`),
  search: (query, params = {}) =>
    api.get("/parfums/search", { params: { q: query, ...params } }),

  // ✅ Recherche par notes multiples (utilise le paramètre 'notes' du backend)
  getByNotes: (noteIds) => {
    const notesParam = Array.isArray(noteIds) ? noteIds.join(",") : noteIds;
    return api.get("/parfums", { params: { notes: notesParam } });
  },

  // ✅ Recherche par une seule note
  getByNote: (noteId) => api.get(`/parfums/note/${noteId}`),

  // ✅ Recherche par similarité avec plusieurs parfums
  getBySimilarity: (parfumIds, options = {}) =>
    api.post("/parfums/similarity", { parfumIds, ...options }),
};

// 📝 NOTE SERVICES (VERSION CORRIGÉE)
export const noteAPI = {
  // Obtenir toutes les notes avec filtres
  getAll: (params = {}) => api.get("/notes", { params }),

  // ✅ Obtenir les notes avec suggestions de position
  getNotesWithSuggestions: (params = {}) =>
    api.get("/notes/suggestions", { params }),

  // ✅ Obtenir les familles olfactives
  getFamilies: () => api.get("/notes/families"),

  // Obtenir une note par ID
  getById: (id) => api.get(`/notes/${id}`),

  // Recherche par nom/synonymes
  search: (query) => api.get("/notes/search", { params: { q: query } }),

  // CRUD Admin
  create: (data) => api.post("/notes", data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

// ❤️ FAVORIS SERVICES
export const favoritesAPI = {
  getFavorites: (params = {}) => api.get("/users/favorites", { params }),
  addParfum: (id) => api.post(`/users/favorites/parfum/${id}`),
  removeParfum: (id) => api.delete(`/users/favorites/parfum/${id}`),
  addNote: (id) => api.post(`/users/favorites/note/${id}`),
  removeNote: (id) => api.delete(`/users/favorites/note/${id}`),
};

// 📚 HISTORIQUE SERVICES
export const historyAPI = {
  getHistory: (params = {}) => api.get("/users/history", { params }),
  addToHistory: (id) => api.post(`/users/history/${id}`),
  clearHistory: () => api.delete("/users/history"),
};

// 👨‍💼 ADMIN SERVICES
export const adminAPI = {
  getUsers: (params = {}) => api.get("/admin/users", { params }),
  getUserStats: () => api.get("/admin/stats/users"),
  exportUsers: () => api.get("/admin/users/export", { responseType: "blob" }),
  toggleAdmin: (id) => api.patch(`/admin/users/${id}/admin`),
};

// 📷 UPLOAD SERVICE
export const uploadAPI = {
  uploadParfumImage: (file) => {
    const formData = new FormData();
    formData.append("photo", file);
    return api.post("/parfums/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ✅ Test de connectivité
export const testAPI = {
  health: () => api.get("/health"),
  testAuth: () => api.get("/users/profile"),
};

export default api;