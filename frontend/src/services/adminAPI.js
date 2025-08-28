import api from "./api.js";

export const adminAPI = {
  // Stats - URLs CORRIGÉES pour correspondre aux routes backend
  getStats: async () => {
    const [users, parfums, notes] = await Promise.all([
      api.get("/admin/stats/users"), // ✅ CORRIGÉ: /admin/stats/users
      api.get("/admin/stats/parfums"), // ✅ CORRIGÉ: /admin/stats/parfums
      api.get("/admin/stats/notes"), // ✅ CORRIGÉ: /admin/stats/notes
    ]);
    return {
      users: users.data,
      parfums: parfums.data,
      notes: notes.data,
    };
  },

  // Utilisateurs - URLs CORRIGÉES
  getUsers: (params = {}) => api.get("/admin/users", { params }), // ✅ CORRIGÉ: /admin/users
  toggleAdmin: (userId) => api.patch(`/admin/users/${userId}/admin`), // ✅ CORRIGÉ: /admin/users/:id/admin
  exportUsers: () => api.get("/admin/users/export", { responseType: "blob" }), // ✅ CORRIGÉ: /admin/users/export

  // Parfums - URL CORRIGÉE
  exportParfums: () =>
    api.get("/admin/parfums/export", { responseType: "blob" }), // ✅ CORRIGÉ: /admin/parfums/export
};
