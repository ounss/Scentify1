// backend/routes/parfumRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import { parfumStorage } from "../config/cloudinary.js"; // ✅ Cloudinary storage
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
import { protect, admin } from "../middleware/authMiddlewareMiddleware.js";
import {
  validateParfum,
  handleValidationErrors,
} from "../middleware/validation.js";
import Parfum from "../models/Parfum.js"; // ✅ Requis pour /search/advanced

const router = express.Router();

/**
 * ✅ Multer avec Cloudinary (plus de stockage local)
 */
const upload = multer({
  storage: parfumStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname || "").toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype || "");
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Format d'image non supporté"));
  },
});

/**
 * ✅ ROUTES PUBLIQUES (spécifiques d'abord)
 */
router.get("/", getParfums); // Liste + filtres
router.get("/search", searchParfums); // Recherche simple
router.get("/stats", getParfumsStats); // Stats
router.post("/similarity", getParfumsBySimilarity); // Similarité

// 🔎 Recherche avancée multi-critères (préserve la fonctionnalité existante)
router.get("/search/advanced", async (req, res, next) => {
  try {
    const { notes, genre, marque, type } = req.query;
    const filter = {};

    if (notes) {
      const notesArray = Array.isArray(notes) ? notes : [notes];
      filter.notes = { $in: notesArray };
    }
    if (genre) filter.genre = genre;
    if (type) filter.type = type;
    if (marque) filter.marque = new RegExp(String(marque), "i");

    const parfums = await Parfum.find(filter).populate("notes");
    return res.json(parfums);
  } catch (err) {
    return next(err);
  }
});

// Parfums par note
router.get("/note/:noteId", getParfumsByNote);

// Paramétrées
router.get("/:id", getParfumById);
router.get("/:id/similar", getSimilarParfums);

/**
 * ✅ ROUTES ADMIN
 */
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
// backend/config/cloudinary.js
