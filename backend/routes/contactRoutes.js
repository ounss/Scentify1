// backend/routes/contactRoutes.js
// ===============================================================

import express from "express";
import {
  sendContactEmail,
  getContactMessages,
  updateContactMessage,
} from "../controllers/contactController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route publique
router.post("/send", sendContactEmail);

// Routes admin
router.get("/", protect, admin, getContactMessages);
router.patch("/:id", protect, admin, updateContactMessage);

export default router;
