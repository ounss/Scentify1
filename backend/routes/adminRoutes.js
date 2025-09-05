// backend/routes/adminRoutes.js - CORRECTION ROUTES ADMIN
import express from "express";
import { protect, admin } from "../middleware/authMiddlewareMiddleware.js";
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

// ✅ PROTECTION: Appliquer middleware à toutes les routes
router.use(protect, admin);

// ✅ ROUTES STATS - URLs cohérentes avec le frontend
router.get("/stats/users", getUserStats);
router.get("/stats/parfums", getParfumsStats);
router.get("/stats/notes", getNotesStats);

// ✅ ROUTES GESTION UTILISATEURS
router.get("/users", getAllUsers);
router.patch("/users/:id/admin", toggleAdminStatus);
router.get("/users/export", exportUsersCSV);

// ✅ ROUTES PARFUMS
router.get("/parfums/export", exportParfumsCSV);

export default router;
