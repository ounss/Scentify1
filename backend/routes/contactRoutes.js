// backend/routes/contactRoutes.js - À CRÉER
import express from "express";
import { sendContactEmail } from "../controllers/contactController.js";

const router = express.Router();
router.post("/contact", sendContactEmail);
export default router;

// backend/controllers/contactController.js - À CRÉER
export const sendContactEmail = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Tous les champs requis" });
    }

    // Email à l'admin
    const emailContent = `
      Nouveau message de contact:
      
      Nom: ${name}
      Email: ${email}
      Sujet: ${subject}
      
      Message:
      ${message}
    `;

    await emailService.sendContactNotification({
      adminEmail: process.env.ADMIN_EMAIL,
      senderName: name,
      senderEmail: email,
      subject: subject || "Nouveau message de contact",
      message: emailContent,
    });

    res.json({ message: "Message envoyé avec succès" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur envoi message", error: error.message });
  }
};
