// frontend/src/services/adminAPI.js - CORRECTION APPELS API
import api from "./api.js";

export const adminAPI = {
  // ✅ STATS - URLs corrigées pour correspondre aux routes backend
  getStats: async () => {
    try {
      const [users, parfums, notes] = await Promise.all([
        api.get("/admin/stats/users"), // ✅ Correspond à router.get("/stats/users")
        api.get("/admin/stats/parfums"), // ✅ Correspond à router.get("/stats/parfums")
        api.get("/admin/stats/notes"), // ✅ Correspond à router.get("/stats/notes")
      ]);

      return {
        users: users.data,
        parfums: parfums.data,
        notes: notes.data,
      };
    } catch (error) {
      console.error("❌ Erreur récupération stats:", error);
      throw error;
    }
  },

  // ✅ UTILISATEURS - URLs corrigées
  getUsers: (params = {}) => {
    console.log("📡 Appel getUsers avec params:", params);
    return api.get("/admin/users", { params });
  },

  toggleAdmin: (userId) => {
    console.log("📡 Toggle admin pour user:", userId);
    return api.patch(`/admin/users/${userId}/admin`);
  },

  exportUsers: () => {
    console.log("📡 Export users CSV");
    return api.get("/admin/users/export", { responseType: "blob" });
  },

  // ✅ PARFUMS - URL corrigée
  exportParfums: () => {
    console.log("📡 Export parfums CSV");
    return api.get("/admin/parfums/export", { responseType: "blob" });
  },
};
