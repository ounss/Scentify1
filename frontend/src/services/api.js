// frontend/src/services/api.js - VERSION COMPLÈTE CORRIGÉE
import axios from "axios";

// Configuration de base
const BASE_URL =
  process.env.REACT_APP_API_URL || "https://scentify-perfume.onrender.com/api";
console.log("Base URL configurée:", BASE_URL);

console.log("🔗 Base URL configurée:", BASE_URL);

// Instance Axios configurée
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("📡 Token ajouté à la requête:", config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse pour gérer les erreurs
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Réponse API: ${response.config.url} ${response.status}`);
    return response;
  },
  (error) => {
    const url = error.config?.url || "URL inconnue";
    const status = error.response?.status || "Pas de status";
    console.log(`❌ Erreur API: ${url} ${status}`);
    console.log("❌ Détails erreur:", error.response?.data);

    if (error.response?.status === 401) {
      console.log("🚪 Token invalide/expiré, suppression...");
      localStorage.removeItem("token");
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

// 🔐 AUTH SERVICES
export const authAPI = {
  register: (userData) => api.post("/users/register", userData),
  login: (credentials) => api.post("/users/login", credentials),
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
  forgotPassword: (email) => api.post("/users/forgot-password", { email }),
  resetPassword: (data) => api.post("/users/reset-password", data),
};

// 🌸 PARFUM SERVICES
export const parfumAPI = {
  getAll: (params = {}) => api.get("/parfums", { params }),
  getById: (id) => api.get(`/parfums/${id}`),
  create: (data) => api.post("/parfums", data),
  update: (id, data) => api.put(`/parfums/${id}`, data),
  delete: (id) => api.delete(`/parfums/${id}`),
  search: (query, params = {}) =>
    api.get("/parfums/search", { params: { q: query, ...params } }),
};

// 📝 NOTE SERVICES - ✅ CORRIGÉ AVEC notesAPI (avec 's') et getByType ajouté
export const notesAPI = {
  getAll: (params = {}) => api.get("/notes", { params }),
  getById: (id) => api.get(`/notes/${id}`),
  getByType: (type) => api.get(`/notes?type=${type}`), // ✅ AJOUTÉ
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
