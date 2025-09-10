// backend/routes/userRoutes.js - IMPORTS ET STRUCTURE CORRIGÉS
import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail, 
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  addFavoriteParfum,
  removeFavoriteParfum,
  removeFavoriteNote,
  addFavoriteNote,
  getUserFavorites,
  addToHistory,
  getUserHistory,
  clearHistory,
  deleteUser,
  getUserStats,
  getAllUsers,
  exportUsersCSV,
  toggleAdminStatus,
} from "../controllers/userController.js";

// ✅ IMPORT CORRECT: authMiddleware.js
import { protect, admin } from "../middleware/authMiddleware.js";

import {
  validateRegister,
  validateLogin,
  ////validateResetPassword,
  handleValidationErrors,
} from "../middleware/validation.js";

const router = express.Router();

// ===== ROUTES PUBLIQUES =====
router.post(
  "/register",
  validateRegister,
  handleValidationErrors,
  registerUser
);
router.post("/login", validateLogin, handleValidationErrors, loginUser);
router.get("/verify-email/:token", verifyEmail); // Token dans l'URL
router.post("/resend-verification", resendVerificationEmail);
router.post("/forgot-password", forgotPassword);
router.post(
  "/reset-password",
  //validateResetPassword,
  handleValidationErrors,
  resetPassword
);

// ===== ROUTES PROTÉGÉES =====
// Middleware protect appliqué à toutes les routes suivantes
router.use(protect);

// Profil utilisateur
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);

// Favoris
router.get("/favorites", getUserFavorites);
router.post("/favorites/parfum/:id", addFavoriteParfum);
router.delete("/favorites/parfum/:id", removeFavoriteParfum);
router.post("/favorites/note/:id", addFavoriteNote);
router.delete("/favorites/note/:id", removeFavoriteNote);

// Historique
router.get("/history", getUserHistory);
router.post("/history/:id", addToHistory);
router.delete("/history", clearHistory);

// Compte
router.delete("/profile", deleteUser);

// ===== ROUTES ADMIN =====
// Routes nécessitant les droits admin
router.get("/all", admin, getAllUsers);
router.get("/stats", admin, getUserStats);
router.get("/export", admin, exportUsersCSV);
router.patch("/:id/admin", admin, toggleAdminStatus);

export default router;
