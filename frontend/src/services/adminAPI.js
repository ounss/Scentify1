import api from "./api.js";

export const adminAPI = {
  // Stats
  getStats: async () => {
    const [users, parfums, notes] = await Promise.all([
      api.get("/users/stats"),
      api.get("/parfums/stats"),
      api.get("/notes/stats"),
    ]);
    return {
      users: users.data,
      parfums: parfums.data,
      notes: notes.data,
    };
  },

  // Utilisateurs
  getUsers: (params = {}) => api.get("/users", { params }),
  toggleAdmin: (userId) => api.patch(`/users/${userId}/admin`),
  exportUsers: () => api.get("/users/export", { responseType: "blob" }),
};
