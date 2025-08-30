// backend/controllers/contactController.js
// ===============================================================

import ContactMessage from "../models/ContactMessage.js";
import { sendContactNotificationToAdmin } from "../services/emailService.js";

// Créer un nouveau message de contact
export const sendContactEmail = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ message: "Tous les champs requis manquent" });
    }

    // Sauvegarder en base
    const contactMessage = new ContactMessage({
      name: name.trim(),
      email: email.trim(),
      subject: subject?.trim() || "Message de contact",
      message: message.trim(),
    });

    await contactMessage.save();

    // Envoyer notification à l'admin (optionnel)
    try {
      await sendContactNotificationToAdmin({
        name: contactMessage.name,
        email: contactMessage.email,
        subject: contactMessage.subject,
        message: contactMessage.message,
        id: contactMessage._id,
        date: contactMessage.createdAt,
      });
    } catch (emailError) {
      console.error("❌ Erreur envoi notification admin:", emailError);
      // Ne pas faire échouer si l'email ne marche pas
    }

    res.json({ message: "Message envoyé avec succès" });
  } catch (error) {
    console.error("❌ Erreur création message contact:", error);
    res.status(500).json({
      message: "Erreur lors de l'envoi du message",
      error: error.message,
    });
  }
};

// [ADMIN] Récupérer tous les messages
export const getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .limit(100); // Limiter à 100 messages

    res.json(messages);
  } catch (error) {
    console.error("❌ Erreur récupération messages:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des messages" });
  }
};

// [ADMIN] Mettre à jour le statut d'un message
export const updateContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { status, adminNote },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: "Message non trouvé" });
    }

    res.json(message);
  } catch (error) {
    console.error("❌ Erreur mise à jour message:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour" });
  }
};
