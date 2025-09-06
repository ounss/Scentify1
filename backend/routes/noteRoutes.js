// backend/routes/noteRoutes.js - ROUTES REFACTORISÉES
import express from "express";
import {
  getNotes,
  getNotesWithSuggestions,
  getNoteById,
  searchNotes,
  getFamilies,
  createNote,
  updateNote,
  deleteNote,
  recalculateAllStats,
} from "../controllers/noteController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { validateNote } from "../middleware/validation.js";

const router = express.Router();

// ===== ROUTES PUBLIQUES =====

// Obtenir toutes les notes avec filtres
router.get("/", getNotes);

// ✅ NOUVEAU : Obtenir les notes avec suggestions
router.get("/suggestions", getNotesWithSuggestions);

// ✅ NOUVEAU : Obtenir les familles olfactives
router.get("/families", getFamilies);

// Rechercher des notes
router.get("/search", searchNotes);

// ❌ SUPPRIMÉ : Route par type fixe
// router.get('/type/:type', getNotesByType);

// Obtenir une note par ID
router.get("/:id", getNoteById);

// ===== ROUTES ADMIN =====

// Créer une note (admin uniquement)
router.post("/", protect, admin, validateNote, createNote);

// Mettre à jour une note (admin uniquement)
router.put("/:id", protect, admin, validateNote, updateNote);

// Supprimer une note (admin uniquement)
router.delete("/:id", protect, admin, deleteNote);
// Ajoutez cette route
router.post("/recalculate", recalculateAllStats);
export default router;
