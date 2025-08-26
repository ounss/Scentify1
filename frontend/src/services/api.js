import axios from "axios";

// Configuration API
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur requête - JWT automatique
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

// Intercepteur réponse - Gestion erreurs
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

// ❤️ FAVORIS SERVICES
export const favoriAPI = {
  getFavorites: () => api.get("/users/favorites"),
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
export default api;

