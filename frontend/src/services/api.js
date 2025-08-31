import axios from "axios";

// Configuration API
const BASE_URL =
  process.env.REACT_APP_API_URL || process.env.NODE_ENV === "production"
    ? "https://scentify-perfume.onrender.com/"
    : "http://localhost:10000";

// ✅ Intercepteur requête - JWT automatique CORRIGÉ
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

// ✅ Intercepteur réponse - Gestion erreurs CORRIGÉ
api.interceptors.response.use(
  (response) => {
    console.log("✅ Réponse API:", response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error("❌ Erreur API:", error.config?.url, error.response?.status);
    console.error("❌ Détails erreur:", error.response?.data);

    if (error.response?.status === 401) {
      console.log("🚪 Token invalide/expiré, suppression...");
      localStorage.removeItem("token");
      // Ne pas rediriger automatiquement, laisser l'app gérer
      // window.location.href = "/auth";
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
  search: (query) => api.get("/parfums/search", { params: { q: query } }),
  getSimilar: (id) => api.get(`/parfums/${id}/similar`),
  create: (data) => api.post("/parfums", data),
  update: (id, data) => api.put(`/parfums/${id}`, data),
  delete: (id) => api.delete(`/parfums/${id}`),
  getStats: () => api.get("/parfums/stats"),
  getBySimilarity: (parfumIds, params = {}) =>
    api.post("/parfums/similarity", { parfumIds }, { params }),
  getByNotes: (noteIds, params = {}) =>
    api.get("/parfums", { params: { notes: noteIds.join(","), ...params } }),
};

// 🏷️ NOTE SERVICES
export const noteAPI = {
  getAll: (params = {}) => api.get("/notes", { params }),
  getById: (id) => api.get(`/notes/${id}`),
  getByType: (type) => api.get(`/notes/type/${type}`),
  search: (query) => api.get("/notes/search", { params: { q: query } }),
  create: (data) => api.post("/notes", data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
  getStats: () => api.get("/notes/stats"),
};

// ❤️ FAVORIS SERVICES - CORRIGÉ URGENCE
export const favoriAPI = {
  getFavorites: () => {
    console.log("📡 Appel getFavorites...");
    return api.get("/users/favorites");
  },
  addParfum: (id) => {
    console.log("📡 Appel addParfum:", id);
    return api.post(`/users/favorites/parfum/${id}`);
  },
  removeParfum: (id) => {
    console.log("📡 Appel removeParfum:", id);
    return api.delete(`/users/favorites/parfum/${id}`);
  },
  addNote: (id) => {
    console.log("📡 Appel addNote:", id);
    return api.post(`/users/favorites/note/${id}`);
  },
  removeNote: (id) => {
    console.log("📡 Appel removeNote:", id);
    return api.delete(`/users/favorites/note/${id}`);
  },
};

// 📚 HISTORIQUE SERVICES - CORRIGÉ URGENCE
export const historyAPI = {
  getHistory: (params = {}) => {
    console.log("📡 Appel getHistory...");
    return api.get("/users/history", { params });
  },
  addToHistory: (id) => {
    console.log("📡 Appel addToHistory:", id);
    return api.post(`/users/history/${id}`);
  },
  clearHistory: () => {
    console.log("📡 Appel clearHistory...");
    return api.delete("/users/history");
  },
};

// 👨‍💼 ADMIN SERVICES
export const adminAPI = {
  getUsers: (params = {}) => api.get("/users", { params }),
  getUserStats: () => api.get("/users/stats"),
  exportUsers: () => api.get("/users/export", { responseType: "blob" }),
  toggleAdmin: (id) => api.patch(`/users/${id}/admin`),
};

// 📷 UPLOAD SERVICE
export const uploadAPI = {
  uploadParfumImage: (file) => {
    const formData = new FormData();
    formData.append("photo", file);
    return api.post("/parfums", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadUserAvatar: (file) => {
    const formData = new FormData();
    formData.append("photo", file);
    return api.put("/users/profile", formData, {
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
