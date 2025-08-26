import api from "./api.js";

export const adminAPI = {
  // Stats
  getStats: async () => {
    const [users, parfums, notes] = await Promise.all([
      api.get("/admin/stats/users"),
      api.get("/admin/stats/parfums"),
      api.get("/admin/stats/notes"),
    ]);
    return {
      users: users.data,
      parfums: parfums.data,
      notes: notes.data,
    };
  },

  // Utilisateurs
  getUsers: (params = {}) => api.get("/admin/users", { params }),
  toggleAdmin: (userId) => api.patch(`/admin/users/${userId}/admin`),
  exportUsers: () => api.get("/admin/users/export", { responseType: "blob" }),

  // Parfums
  exportParfums: () =>
    api.get("/admin/parfums/export", { responseType: "blob" }),
};
