import express from "express";
import multer from "multer";
import path from "path";
import {
  registerUser,
  loginUser,
  verifyEmail,
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
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  validateRegister,
  validateLogin,
  handleValidationErrors,
} from "../middleware/validation.js";

const router = express.Router();

// Configuration multer pour upload d'avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
        file.originalname
      )}`
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Format d'image non supporté"));
    }
  },
});

// Routes publiques
router.post(
  "/register",
  validateRegister,
  handleValidationErrors,
  registerUser
);
router.post("/login", validateLogin, handleValidationErrors, loginUser);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Routes privées
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, upload.single("photo"), updateUserProfile);
router.delete("/profile", protect, deleteUser);

// Favoris
router.post("/favorites/parfum/:id", protect, addFavoriteParfum);
router.delete("/favorites/parfum/:id", protect, removeFavoriteParfum);
router.post("/favorites/note/:id", protect, addFavoriteNote);
router.delete("/favorites/note/:id", protect, removeFavoriteNote);
router.get("/favorites", protect, getUserFavorites);

// Historique
router.post("/history/:id", protect, addToHistory);
router.get("/history", protect, getUserHistory);
router.delete("/history", protect, clearHistory);

// Routes admin
router.get("/stats", protect, admin, getUserStats);
router.get("/", protect, admin, getAllUsers);
router.get("/export", protect, admin, exportUsersCSV);
router.patch("/:id/admin", protect, admin, toggleAdminStatus);

export default router;
