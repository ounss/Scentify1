import axios from "axios";

// ✅ Configuration API CORRIGÉE
const api = axios.create({
  // AVANT: "http://localhost:/api" (❌ port manquant!)
  // MAINTENANT: URL complète avec fallback
  baseURL:
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://TON-BACKEND-URL.onrender.com/api" // ← Remplace par ton URL Render backend
      : "http://localhost:10000/api"),

  timeout: 15000, // Augmenté pour Render (peut être lent)
  headers: {
    "Content-Type": "application/json",
  },
});

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

    // Debug: afficher l'URL complète
    console.log("📡 Requête vers:", config.baseURL + config.url);

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
    console.error(
      "❌ URL complète:",
      error.config?.baseURL + error.config?.url
    );

    if (error.response?.status === 401) {
      console.log("🚪 Token invalide/expiré, suppression...");
      localStorage.removeItem("token");
    }

    // Ajouter plus d'infos sur les erreurs de connexion
    if (!error.response) {
      console.error("❌ Erreur de connexion - Backend inaccessible");
      console.error("❌ Vérifiez que le backend est démarré et accessible");
    }

    return Promise.reject(error);
  }
);

// 🔐 AUTH SERVICES (reste identique)
export const authAPI = {
  register: (userData) => api.post("/users/register", userData),
  login: (credentials) => api.post("/users/login", credentials),
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) =>
    api.post("/auth/reset-password", { token, password }),
};

// 🌸 PARFUMS SERVICES
export const parfumAPI = {
  getAll: (params = {}) => {
    console.log("📡 Appel getAll parfums avec params:", params);
    return api.get("/parfums", { params });
  },
  getById: (id) => {
    console.log("📡 Appel getById parfum:", id);
    return api.get(`/parfums/${id}`);
  },
  create: (data) => api.post("/parfums", data),
  update: (id, data) => api.put(`/parfums/${id}`, data),
  delete: (id) => api.delete(`/parfums/${id}`),
  search: (query) => {
    console.log("📡 Appel search parfums:", query);
    return api.get("/parfums/search", { params: { q: query } });
  },
};

// 📝 NOTES SERVICES
export const noteAPI = {
  getAll: (params = {}) => api.get("/notes", { params }),
  getById: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post("/notes", data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

// ❤️ FAVORIS SERVICES
export const favoritesAPI = {
  getParfums: () => {
    console.log("📡 Appel getParfums favoris...");
    return api.get("/users/favorites/parfums");
  },
  getNotes: () => {
    console.log("📡 Appel getNotes favoris...");
    return api.get("/users/favorites/notes");
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

// 📚 HISTORIQUE SERVICES
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

// 📧 CONTACT SERVICE
export const contactAPI = {
  send: (data) => {
    console.log("📡 Appel contact send:", data);
    return api.post("/contact", data);
  },
  getAll: () => api.get("/contact"), // Admin only
  updateStatus: (id, data) => api.put(`/contact/${id}`, data), // Admin only
};

// ✅ Test de connectivité
export const testAPI = {
  health: () => {
    console.log("📡 Test de santé du backend...");
    return api.get("/health");
  },
  testAuth: () => api.get("/users/profile"),
};

export default api;
