import nodemailer from "nodemailer";
import crypto from "crypto";

// Configuration transporteur email
const createTransporter = () => {
  if (process.env.NODE_ENV === "production") {
    return nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Transporteur de test pour développement
    return nodemailer.createTransporter({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "ethereal.user@ethereal.email",
        pass: "ethereal.pass",
      },
    });
  }
};

// Générer un token sécurisé
export const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Envoyer email de reset password
export const sendPasswordResetEmail = async (user, token) => {
  try {
    const transporter = createTransporter();

    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@scentify.app",
      to: user.email,
      subject: "Réinitialisation de votre mot de passe - Scentify",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2>Réinitialisation de mot de passe</h2>
          <p>Bonjour ${user.username},</p>
          <p>Vous avez demandé une réinitialisation de votre mot de passe sur Scentify.</p>
          <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
          <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
          <p>Ce lien expirera dans 1 heure.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          <hr>
          <p><small>L'équipe Scentify</small></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email de reset envoyé à:", user.email);
  } catch (error) {
    console.error("Erreur envoi email:", error);
    throw new Error("Impossible d'envoyer l'email");
  }
};

export default {
  generateToken,
  sendPasswordResetEmail,
};
// Export du service email
