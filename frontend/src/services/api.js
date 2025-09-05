// frontend/src/services/api.js
import axios from "axios";

// ✅ Configuration API CORRIGÉE
const BASE_URL =
  process.env.REACT_APP_API_URL || "https://scentify-perfume.onrender.com/api";

console.log("Base URL configurée:", BASE_URL);
console.log("🔗 Base URL configurée:", BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // ✅ Timeout pour éviter les blocages
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
    } else {
      console.log("⚠️ Pas de token pour la requête:", config.url);
    }
    return config;
  },
  (error) => {
    console.error("❌ Erreur intercepteur requête:", error);
    return Promise.reject(error);
  }
);

// ✅ Intercepteur réponse - Gestion erreurs améliorée
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

    if (error.response?.status === 401) {
      console.log("🚪 Token invalide/expiré, suppression...");
      localStorage.removeItem("token");
      // Redirection optionnelle
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
  resetPassword: (data) => api.post("/users/reset-password", data), // ✅ CORRIGÉ
};

// 🌸 PARFUM SERVICES (VERSION CORRIGÉE)
export const parfumAPI = {
  getAll: (params = {}) => api.get("/parfums", { params }),
  getById: (id) => api.get(`/parfums/${id}`),
  create: (data) => api.post("/parfums", data),
  update: (id, data) => api.put(`/parfums/${id}`, data),
  delete: (id) => api.delete(`/parfums/${id}`),
  search: (query, params = {}) =>
    api.get("/parfums/search", { params: { q: query, ...params } }),

  // ✅ AJOUT : Recherche par notes multiples (utilise le paramètre 'notes' du backend)
  getByNotes: (noteIds) => {
    const notesParam = Array.isArray(noteIds) ? noteIds.join(",") : noteIds;
    return api.get("/parfums", { params: { notes: notesParam } });
  },

  // ✅ AJOUT : Recherche par une seule note
  getByNote: (noteId) => api.get(`/parfums/note/${noteId}`),
};

// 📝 NOTE SERVICES (VERSION CORRIGÉE)
// frontend/src/services/api.js - SECTION NOTES MISE À JOUR

// ✅ NOTES SERVICES REFACTORISÉS
export const noteAPI = {
  // Obtenir toutes les notes avec filtres
  getAll: (params = {}) => api.get("/notes", { params }),

  // ✅ NOUVEAU : Obtenir les notes avec suggestions de position
  getNotesWithSuggestions: (params = {}) =>
    api.get("/notes/suggestions", { params }),

  // ✅ NOUVEAU : Obtenir les familles olfactives
  getFamilies: () => api.get("/notes/families"),

  // Obtenir une note par ID
  getById: (id) => api.get(`/notes/${id}`),

  // ❌ SUPPRIMÉ : getByType (plus de types fixes)
  // getByType: (type) => api.get(`/notes/type/${type}`),

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
  getUsers: (params = {}) => api.get("/admin/users", { params }), // ✅ Route corrigée
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
  // uploadUserAvatar: (file) => {
  //   const formData = new FormData();
  //   formData.append("photo", file);
  //   return api.put("/users/profile/avatar", formData, {
  //     headers: { "Content-Type": "multipart/form-data" },
  //   });
  // },
};

// ✅ Test de connectivité
export const testAPI = {
  health: () => api.get("/health"),
  testAuth: () => api.get("/users/profile"),
};

export default api;
