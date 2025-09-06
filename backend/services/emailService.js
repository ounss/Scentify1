// backend/services/emailService.js
import nodemailer from "nodemailer";
import crypto from "crypto";

// ————————————————————————————————
// Helpers
// ————————————————————————————————
const normalizeBaseUrl = (url) => {
  const frontendUrl = url || "https://scentify-perfumes.onrender.com";
  console.log("🔧 Debug normalizeBaseUrl:");
  console.log("  - URL passée en paramètre:", url);
  console.log("  - process.env.FRONTEND_URL:", process.env.FRONTEND_URL);
  console.log("  - URL finale utilisée:", frontendUrl);

  return frontendUrl.replace(/\/+$/, "");
}; //

// ✅ Configuration transporteur email
const createTransport = () => {
  if (process.env.NODE_ENV === "production") {
    // Configuration pour Gmail en production
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // votre-email@gmail.com
        pass: process.env.EMAIL_PASS, // mot de passe d'application Gmail
      },
      secure: true,
    });
  } else {
    // ✅ Configuration SMTP pour développement
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false, // true pour 465, false pour autres ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
};

// ✅ Test de connexion au démarrage
export const testEmailConnection = async () => {
  try {
    const Transport = createTransport();
    await Transport.verify();
    console.log("✅ Service email configuré correctement");
    return true;
  } catch (error) {
    console.error("❌ Erreur configuration email:", error);
    return false;
  }
};

// Générer un token sécurisé
export const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// ✅ Email de vérification
export const sendVerificationEmail = async (user, token) => {
  try {
    // ⛔️ Ne pas envoyer un lien avec token manquant
    if (!token) {
      throw new Error(
        "Verification token manquant : passe un token valide à sendVerificationEmail."
      );
    }

    const Transport = createTransport();
    const baseUrl = normalizeBaseUrl(process.env.FRONTEND_URL);
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"Scentify" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Vérifiez votre compte Scentify",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #a44949, #c56b6b); border-radius: 15px; margin: 0 auto; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                <span style="color: white; font-size: 24px; font-weight: bold;">S</span>
              </div>
              <h1 style="color: #2c2c2c; margin: 0;">Scentify</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Votre guide dans l'univers des parfums</p>
            </div>

            <h2 style="color: #2c2c2c; margin-bottom: 20px;">Bienvenue ${user.username} !</h2>
            <p style="color: #2c2c2c; line-height: 1.6; margin-bottom: 15px;">
              Votre compte Scentify a été créé avec succès. Pour commencer à explorer notre univers olfactif, veuillez vérifier votre adresse email.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" 
                 style="background: linear-gradient(135deg, #a44949, #c56b6b); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(164, 73, 73, 0.3);">
                Vérifier mon email
              </a>
            </div>

            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
            </p>
            <p style="word-break: break-all; color: #a44949; font-size: 14px; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
              ${verifyUrl}
            </p>

            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
            <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center;">
              L'équipe Scentify<br>
              Brussels, Belgium
            </p>
          </div>
        </div>
      `,
    };

    const result = await Transport.sendMail(mailOptions);
    console.log("✅ Email de vérification envoyé à:", user.email);
    return result;
  } catch (error) {
    console.error("❌ Erreur envoi email vérification:", error);
    throw error;
  }
};

// ✅ Email de reset password
export const sendPasswordResetEmail = async (user, token) => {
  try {
    // ⛔️ Ne pas envoyer un lien avec token manquant
    if (!token) {
      throw new Error(
        "Password reset token manquant : passe un token valide à sendPasswordResetEmail."
      );
    }

    const Transport = createTransport();
    const baseUrl = normalizeBaseUrl(process.env.FRONTEND_URL);
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Scentify" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Réinitialisation de votre mot de passe - Scentify",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #a44949, #c56b6b); border-radius: 15px; margin: 0 auto; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                <span style="color: white; font-size: 24px; font-weight: bold;">S</span>
              </div>
              <h1 style="color: #2c2c2c; margin: 0;">Scentify</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Votre guide dans l'univers des parfums</p>
            </div>

            <h2 style="color: #2c2c2c; margin-bottom: 20px;">Réinitialisation de mot de passe</h2>
            <p style="color: #2c2c2c; line-height: 1.6; margin-bottom: 15px;">Bonjour ${user.username},</p>
            <p style="color: #2c2c2c; line-height: 1.6; margin-bottom: 15px;">
              Vous avez demandé une réinitialisation de votre mot de passe sur Scentify.
            </p>
            <p style="color: #2c2c2c; line-height: 1.6; margin-bottom: 25px;">
              Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #a44949, #c56b6b); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(164, 73, 73, 0.3);">
                Réinitialiser mon mot de passe
              </a>
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 25px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                ⏰ <strong>Ce lien expirera dans 1 heure</strong> pour votre sécurité.
              </p>
            </div>

            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
            </p>
            <p style="word-break: break-all; color: #a44949; font-size: 14px; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>

            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet email en toute sécurité.
            </p>
            <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center;">
              L'équipe Scentify
            </p>
          </div>
        </div>
      `,
    };

    const result = await Transport.sendMail(mailOptions);
    console.log("✅ Email de reset envoyé à:", user.email);
    return result;
  } catch (error) {
    console.error("❌ Erreur envoi email reset:", error);
    throw error;
  }
};

// ✅ Email de bienvenue (optionnel)
export const sendWelcomeEmail = async (user) => {
  try {
    const Transport = createTransport();
    const baseUrl = normalizeBaseUrl(process.env.FRONTEND_URL);

    const mailOptions = {
      from: `"Scentify" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Bienvenue sur Scentify ! 🌸",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
          <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #a44949, #c56b6b); border-radius: 15px; margin: 0 auto; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                <span style="color: white; font-size: 24px; font-weight: bold;">S</span>
              </div>
              <h1 style="color: #2c2c2c; margin: 0;">Scentify</h1>
            </div>

            <h2 style="color: #2c2c2c; margin-bottom: 20px;">Bienvenue ${user.username} ! 👋</h2>
            <p style="color: #2c2c2c; line-height: 1.6;">
              Votre compte Scentify a été créé avec succès. Nous sommes ravis de vous accueillir dans notre univers olfactif !
            </p>
            
            <h3 style="color: #a44949;">Que pouvez-vous faire sur Scentify ?</h3>
            <ul style="color: #2c2c2c; line-height: 1.6;">
              <li>🔍 Découvrir de nouveaux parfums</li>
              <li>❤️ Créer votre liste de favoris</li>
              <li>🎯 Obtenir des recommandations personnalisées</li>
              <li>📊 Analyser les notes olfactives</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}" 
                 style="background: linear-gradient(135deg, #a44949, #c56b6b); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;">
                Commencer l'exploration
              </a>
            </div>

            <p style="color: #666; font-size: 14px; text-align: center;">
              L'équipe Scentify
            </p>
          </div>
        </div>
      `,
    };

    const result = await Transport.sendMail(mailOptions);
    console.log("✅ Email de bienvenue envoyé à:", user.email);
    return result;
  } catch (error) {
    console.error("❌ Erreur envoi email bienvenue:", error);
    return null; // on n'échoue pas l'inscription
  }
};

// ✅ Notification admin pour contact
export const sendContactNotificationToAdmin = async (contactData) => {
  try {
    const Transport = createTransport();

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (!adminEmail) {
      throw new Error("ADMIN_EMAIL non configuré");
    }

    const dashboardUrl = `${normalizeBaseUrl(
      process.env.FRONTEND_URL
    )}/admin/dashboard`;

    const emailContent = `
      🔔 NOUVEAU MESSAGE DE CONTACT
      
      De: ${contactData.name} (${contactData.email})
      Sujet: ${contactData.subject}
      Date: ${
        contactData.date
          ? new Date(contactData.date).toLocaleString("fr-FR")
          : new Date().toLocaleString("fr-FR")
      }
      
      MESSAGE:
      ${contactData.message}
      
      Voir dans le dashboard: ${dashboardUrl}
      Message ID: ${contactData.id || "N/A"}
    `;

    const mailOptions = {
      from: `"Scentify" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `🔔 Nouveau message de contact - ${contactData.subject}`,
      text: emailContent,
    };

    const result = await Transport.sendMail(mailOptions);
    console.log("✅ Notification admin envoyée:", result.messageId);
    return result;
  } catch (error) {
    console.error("❌ Erreur envoi notification admin:", error);
    throw error;
  }
};

// ✅ Variables d'environnement requises (basique)
export const getRequiredEnvVars = () => {
  const required = ["EMAIL_USER", "EMAIL_PASS"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      "❌ Variables d'environnement manquantes pour l'email:",
      missing.join(", ")
    );
    console.log("ℹ️  Ajoutez ces variables à votre fichier .env :");
    console.log("EMAIL_USER=votre-email@gmail.com");
    console.log("EMAIL_PASS=votre-mot-de-passe-application");
    return false;
  }
  return true;
};

export default {
  generateToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendContactNotificationToAdmin,
  testEmailConnection,
  getRequiredEnvVars,
};
