import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  getUserStats,
  getAllUsers,
  exportUsersCSV,
  toggleAdminStatus,
} from "../controllers/userController.js";
import {
  getParfumsStats,
  exportParfumsCSV,
} from "../controllers/parfumController.js";
import { getNotesStats } from "../controllers/noteController.js";

const router = express.Router();

// Stats globales
router.use(protect, admin); // Appliquer à toutes les routes
router.get("/stats/users", protect, admin, getUserStats);
router.get("/stats/parfums", protect, admin, getParfumsStats);
router.get("/stats/notes", protect, admin, getNotesStats);
router.get("/stats/users", getUserStats);
router.get("/stats/parfums", getParfumsStats);

// Gestion utilisateurs
router.get("/users", protect, admin, getAllUsers);
router.patch("/users/:id/admin", protect, admin, toggleAdminStatus);
router.get("/users/export", protect, admin, exportUsersCSV);

// Export parfums
router.get("/parfums/export", protect, admin, exportParfumsCSV);

export default router;
