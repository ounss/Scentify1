import express from "express";
import multer from "multer";
import path from "path";
import {
  getParfums,
  getParfumById,
  getParfumsByNote,
  getSimilarParfums,
  createParfum,
  updateParfum,
  deleteParfum,
  searchParfums,
} from "../controllers/parfumController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  validateParfum,
  handleValidationErrors,
} from "../middleware/validation.js";

const router = express.Router();

// Configuration multer pour upload d'images
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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
router.get("/", getParfums);
router.get("/search", searchParfums);
router.get("/:id", getParfumById);
router.get("/:id/similar", getSimilarParfums);
router.get("/note/:noteId", getParfumsByNote);
router.post("/similarity", getParfumsBySimilarity);

// Routes admin
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

export default router;
