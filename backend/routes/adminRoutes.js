// backend/routes/adminRoutes.js - À COMPLÉTER
import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  getUserStats,
  getAllUsers,
  exportUsersCSV,
  toggleAdminStatus,
  deleteUserById,
} from "../controllers/userController.js";
import {
  getParfumsStats,
  exportParfumsCSV,
  deleteParfum,
  updateParfum,
} from "../controllers/parfumController.js";
import {
  deleteNote,
  updateNote,
  createNote,
  getNotesStats,
} from "../controllers/noteController.js";

const router = express.Router();
router.use(protect, admin);

// ✅ Stats
router.get("/stats/users", getUserStats);
router.get("/stats/parfums", getParfumsStats);
router.get("/stats/notes", getNotesStats);

// ✅ Utilisateurs
router.get("/users", getAllUsers);
router.patch("/users/:id/admin", toggleAdminStatus);
router.delete("/users/:id", deleteUserById);
router.get("/users/export", exportUsersCSV);

// ❌ MANQUANT : Parfums admin
router.delete("/parfums/:id", deleteParfum); // 🔥 MANQUANT !
router.put("/parfums/:id", updateParfum); // 🔥 MANQUANT !

// ❌ MANQUANT : Notes admin
router.delete("/notes/:id", deleteNote); // 🔥 MANQUANT !
router.put("/notes/:id", updateNote); // 🔥 MANQUANT !
router.post("/notes", createNote); // 🔥 MANQUANT !

// ✅ Export
router.get("/parfums/export", exportParfumsCSV);

export default router;
