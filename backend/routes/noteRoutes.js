import express from "express";
import {
  getNotes,
  getNoteById,
  getNotesByType,
  searchNotes,
  createNote,
  updateNote,
  deleteNote,
  getNotesStats,
} from "../controllers/noteController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  validateNote,
  handleValidationErrors,
} from "../middleware/validation.js";

const router = express.Router();

// Routes publiques
router.get("/", getNotes);
router.get("/search", searchNotes);
router.get("/stats", getNotesStats);
router.get("/type/:type", getNotesByType);
router.get("/:id", getNoteById);

// Routes admin
router.post(
  "/",
  protect,
  admin,
  validateNote,
  handleValidationErrors,
  createNote
);
router.put(
  "/:id",
  protect,
  admin,
  validateNote,
  handleValidationErrors,
  updateNote
);
router.delete("/:id", protect, admin, deleteNote);

export default router;
