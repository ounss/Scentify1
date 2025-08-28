// backend/routes/parfumRoutes.js - CORRECTION ORDRE DES ROUTES
import express from "express";
import multer from "multer";
import path from "path";
import {
  getParfums,
  getParfumById,
  getParfumsByNote,
  getSimilarParfums,
  getParfumsBySimilarity,
  createParfum,
  updateParfum,
  deleteParfum,
  searchParfums,
  getParfumsStats,
  exportParfumsCSV,
  importParfumsCSV,
} from "../controllers/parfumController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  validateParfum,
  handleValidationErrors,
} from "../middleware/validation.js";

const router = express.Router();

// Configuration multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/parfums/");
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
  limits: { fileSize: 5 * 1024 * 1024 },
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

// ✅ ROUTES PUBLIQUES - ORDRE CRITIQUE CORRIGÉ
router.get("/", getParfums); // Liste parfums avec filtres
router.get("/search", searchParfums); // ✅ AVANT /:id - Recherche parfums
router.get("/stats", getParfumsStats); // ✅ AVANT /:id - Stats
router.post("/similarity", getParfumsBySimilarity); // ✅ AVANT /:id - Similarité

// ✅ ROUTES AVEC PARAMÈTRES - APRÈS LES ROUTES SPÉCIFIQUES
router.get("/:id", getParfumById); // ✅ APRÈS les routes spécifiques
router.get("/:id/similar", getSimilarParfums); // ✅ Parfums similaires à un parfum
router.get("/note/:noteId", getParfumsByNote); // ✅ Parfums par note
// Ajouter la recherche avancée avec multiples filtres
router.get("/search/advanced", async (req, res) => {
  const { notes, genre, marque, type } = req.query;
  const filter = {};

  if (notes) {
    const notesArray = Array.isArray(notes) ? notes : [notes];
    filter.notes = { $in: notesArray };
  }
  if (genre) filter.genre = genre;
  if (marque) filter.marque = new RegExp(marque, "i");
  if (type) filter.type = type;

  const parfums = await Parfum.find(filter).populate("notes");
  res.json(parfums);
});
// ✅ ROUTES ADMIN
router.post(
  "/",
  protect,
  admin,
  upload.single("photo"),
  validateParfum,
  handleValidationErrors,
  createParfum
);
router.put("/:id", protect, admin, upload.single("photo"), updateParfum);
router.delete("/:id", protect, admin, deleteParfum);
router.get("/export/csv", protect, admin, exportParfumsCSV);
router.post(
  "/import/csv",
  protect,
  admin,
  upload.single("file"),
  importParfumsCSV
);

export default router;
