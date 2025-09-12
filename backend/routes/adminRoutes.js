// backend/routes/adminRoutes.js - À COMPLÉTER
import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  getUserStats,
  getAllUsers,
  exportUsersCSV,
  toggleAdminStatus,
  deleteUserById,
  //  updateUserById,
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
} from "../controllers/noteController.js";

const router = express.Router();
router.use(protect, admin);

// ✅ Stats
router.get("/stats/users", getUserStats);
router.get("/stats/parfums", getParfumsStats);

// ✅ Utilisateurs
router.get("/users", getAllUsers);
router.patch("/users/:id/admin", toggleAdminStatus);
router.delete("/users/:id", deleteUserById); // 🔥 MANQUANT !
//router.put("/users/:id", updateUserById); // 🔥 MANQUANT !
router.get("/users/export", exportUsersCSV);

// ❌ MANQUANT : Parfums admin
router.delete("/parfums/:id", deleteParfum); // 🔥 MANQUANT !
router.put("/parfums/:id", updateParfum); // 🔥 MANQUANT !
router.delete("/users/:id", deleteUserById);

// ❌ MANQUANT : Notes admin
router.delete("/notes/:id", deleteNote); // 🔥 MANQUANT !
router.put("/notes/:id", updateNote); // 🔥 MANQUANT !
router.post("/notes", createNote); // 🔥 MANQUANT !

// ✅ Export
router.get("/parfums/export", exportParfumsCSV);

export default router;
