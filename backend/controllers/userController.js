// controllers/userController.js - VERSION SÉCURISÉE AVEC COOKIES
import User from "../models/User.js";
import Parfum from "../models/Parfum.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import emailService from "../services/emailService.js";
import csvService from "../services/csvService.js";
import crypto from "crypto";
import mongoose from "mongoose";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ✅ NOUVELLE FONCTION : Configuration cookies sécurisés
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
    httpOnly: true, // 🛡️ PROTECTION XSS : Token inaccessible via JavaScript
    secure: isProduction, // 🔒 HTTPS obligatoire en production
    sameSite: isProduction ? "none" : "lax", // 🌐 Cross-origin pour Render
  };
};

// ✅ Inscription (inchangée)
export const registerUser = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const message =
        existingUser.email === email
          ? "Email déjà utilisé"
          : "Nom d'utilisateur déjà pris";
      return res.status(400).json({ message });
    }

    // ✅ CHANGEMENT: Créer utilisateur avec vérification email
    const user = await User.create({
      email,
      password,
      username,
      isVerified: false, // Nécessite vérification email
      emailVerificationToken: crypto.randomBytes(32).toString("hex"),
    });

    // ✅ Envoyer email de vérification
    try {
      await emailService.sendVerificationEmail(
        user,
        user.emailVerificationToken
      );
      console.log("✅ Email de vérification envoyé à:", user.email);
    } catch (emailError) {
      console.error("❌ Erreur envoi email:", emailError);
      // Ne pas faire échouer l'inscription si l'email ne peut pas être envoyé
    }

    res.status(201).json({
      message: "Compte créé avec succès. Vérifiez votre email pour l'activer.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("❌ Erreur registerUser:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ NOUVEAU: Route de vérification email avec cookie
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params; // Token dans l'URL

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Token de vérification invalide" });
    }

    // Activer le compte
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    // ✅ Envoyer email de bienvenue (optionnel)
    try {
      await emailService.sendWelcomeEmail(user);
    } catch (emailError) {
      console.error("❌ Erreur envoi email bienvenue:", emailError);
    }

    // Générer token JWT pour connexion automatique
    const jwtToken = generateToken(user._id);

    // 🍪 SÉCURITÉ : Définir cookie httpOnly au lieu de renvoyer le token
    res.cookie("authToken", jwtToken, getCookieOptions());

    res.json({
      message: "Email vérifié avec succès !",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: true,
      },
    });
  } catch (error) {
    console.error("❌ Erreur verifyEmail:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ MODIFICATION: Connexion avec cookie sécurisé
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof password !== "string") {
      return res
        .status(400)
        .json({ message: "Email et mot de passe sont requis" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    // ✅ VÉRIFICATION: Email doit être vérifié
    if (!user.isVerified) {
      return res.status(401).json({
        message: "Veuillez vérifier votre email avant de vous connecter.",
        needsVerification: true,
      });
    }

    const token = generateToken(user._id);

    // 🍪 SÉCURITÉ : Définir cookie httpOnly au lieu de renvoyer le token
    res.cookie("authToken", token, getCookieOptions());

    res.json({
      message: "Connexion réussie",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("❌ Erreur loginUser:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ NOUVELLE FONCTION : Déconnexion sécurisée
export const logoutUser = async (req, res) => {
  try {
    // 🗑️ SÉCURITÉ : Supprimer le cookie httpOnly
    res.cookie("authToken", "", {
      ...getCookieOptions(),
      expires: new Date(0), // Expiration immédiate
    });

    res.json({ message: "Déconnexion réussie" });
  } catch (error) {
    console.error("❌ Erreur logout:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ NOUVELLE FONCTION : Vérification auth pour refresh
// backend/controllers/userController.js - CORRECTION checkAuth
export const checkAuth = async (req, res) => {
  try {
    let token;
    
    // Lire le token depuis les cookies
    if (req.cookies?.authToken) {
      token = req.cookies.authToken;
    } else if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Pas de token" });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Chercher l'utilisateur
    const user = await User.findById(decoded.id)
      .populate("favorisParfums", "nom marque photo genre")
      .populate("favorisNotes", "nom type")
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json({
      message: "Utilisateur authentifié",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        favorisParfums: user.favorisParfums,
        favorisNotes: user.favorisNotes,
      },
    });
  } catch (error) {
    console.error("❌ Erreur checkAuth:", error);
    res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

// ✅ NOUVEAU: Renvoyer email de vérification (inchangé)
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email requis" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Ce compte est déjà vérifié" });
    }

    // Générer nouveau token
    user.emailVerificationToken = crypto.randomBytes(32).toString("hex");
    await user.save();

    // Envoyer email
    await emailService.sendVerificationEmail(user, user.emailVerificationToken);

    res.json({ message: "Email de vérification renvoyé" });
  } catch (error) {
    console.error("❌ Erreur resendVerificationEmail:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Mot de passe oublié (inchangé - ne connecte pas)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email requis" });

    const user = await User.findOne({ email });
    if (!user) {
      // Réponse générique pour ne pas divulguer l'existence d'un compte
      return res.json({ message: "Email envoyé si l'utilisateur existe" });
    }

    const resetToken = emailService.generateToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1h
    await user.save();

    await emailService.sendPasswordResetEmail(user, resetToken);

    res.json({ message: "Email de reset envoyé" });
  } catch (error) {
    console.error("Erreur forgotPassword:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Reset mot de passe (inchangé - ne connecte pas automatiquement)
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || typeof password !== "string") {
      return res
        .status(400)
        .json({ message: "Token et nouveau mot de passe requis" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré" });
    }

    user.password = password; // hook Mongoose pour hash
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Mot de passe réinitialisé" });
  } catch (error) {
    console.error("Erreur resetPassword:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Profil utilisateur (inchangé)
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("favorisParfums", "nom marque photo genre")
      .populate("favorisNotes", "nom type")
      .populate("historique.parfum", "nom marque photo genre");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    console.log(`✅ Profil utilisateur récupéré: ${user.username}`);
    console.log(`📦 Favoris parfums: ${user.favorisParfums?.length || 0}`);
    console.log(`🏷️ Favoris notes: ${user.favorisNotes?.length || 0}`);
    console.log(`📖 Historique: ${user.historique?.length || 0}`);

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      photo: user.photo,
      isAdmin: user.isAdmin,
      favorisParfums: user.favorisParfums || [],
      favorisNotes: user.favorisNotes || [],
      historique: user.historique || [],
      preferences: user.preferences,
      favoriCount:
        (user.favorisParfums?.length || 0) + (user.favorisNotes?.length || 0),
      historiqueCount: user.historique?.length || 0,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Erreur getUserProfile:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Mise à jour profil (inchangé)
export const updateUserProfile = async (req, res) => {
  try {
    console.log("🔄 Tentative mise à jour profil pour:", req.user._id);
    console.log("📝 Données reçues:", req.body);

    const user = await User.findById(req.user._id);

    if (!user) {
      console.log("❌ Utilisateur non trouvé:", req.user._id);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // ✅ AJOUT : Vérification d'unicité du username si modifié
    if (req.body.username && req.body.username !== user.username) {
      const existingUser = await User.findOne({
        username: req.body.username,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        console.log("❌ Username déjà pris:", req.body.username);
        return res
          .status(400)
          .json({ message: "Ce nom d'utilisateur est déjà pris" });
      }
    }

    // ✅ AJOUT : Vérification d'unicité de l'email si modifié
    if (req.body.email && req.body.email !== user.email) {
      const existingEmail = await User.findOne({
        email: req.body.email,
        _id: { $ne: user._id },
      });

      if (existingEmail) {
        console.log("❌ Email déjà pris:", req.body.email);
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }
    }

    // Mise à jour des champs
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    if (req.file) {
      user.photo = req.file.path;
    }

    if (req.body.preferences) {
      user.preferences = { ...user.preferences, ...req.body.preferences };
    }

    const updatedUser = await user.save();

    console.log("✅ Profil mis à jour avec succès:", updatedUser.username);

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      photo: updatedUser.photo,
      isAdmin: updatedUser.isAdmin,
      preferences: updatedUser.preferences,
      createdAt: updatedUser.createdAt,
      isVerified: updatedUser.isVerified, // ✅ AJOUT pour compatibilité
    });
  } catch (error) {
    console.error("❌ Erreur updateUserProfile:", error);

    // ✅ AMÉLIORATION : Gestion spécifique des erreurs Mongoose
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const message =
        field === "username"
          ? "Ce nom d'utilisateur est déjà pris"
          : "Cet email est déjà utilisé";
      console.log("❌ Erreur unicité:", message);
      return res.status(400).json({ message });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      console.log("❌ Erreur validation:", messages);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({
      message: "Erreur serveur lors de la mise à jour du profil",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/* ------------------------------ FAVORIS ------------------------------ */

// ✅ Ajouter un parfum aux favoris (inchangé)
export const addFavoriteParfum = async (req, res) => {
  try {
    const userId = req.user._id;
    const parfumId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(parfumId)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    console.log(`💝 Ajout favori parfum: ${parfumId} pour user: ${userId}`);

    const parfumExists = await Parfum.findById(parfumId);
    if (!parfumExists) {
      return res.status(404).json({ message: "Parfum non trouvé" });
    }

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé" });

    const isAlreadyFavorite = user.favorisParfums.some(
      (id) => id.toString() === parfumId
    );
    if (isAlreadyFavorite) {
      return res.status(400).json({ message: "Parfum déjà en favoris" });
    }

    user.favorisParfums.push(parfumId);
    await user.save();

    console.log(`✅ Parfum ${parfumId} ajouté aux favoris de ${user.username}`);

    res.json({
      message: "Parfum ajouté aux favoris",
      favoriCount: user.favorisParfums.length,
    });
  } catch (error) {
    console.error("❌ Erreur addFavoriteParfum:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Retirer un parfum des favoris (inchangé)
export const removeFavoriteParfum = async (req, res) => {
  try {
    const userId = req.user._id;
    const parfumId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(parfumId)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    console.log(
      `💝 Suppression favori parfum: ${parfumId} pour user: ${userId}`
    );

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé" });

    const initialLength = user.favorisParfums.length;
    user.favorisParfums = user.favorisParfums.filter(
      (id) => id.toString() !== parfumId
    );

    if (user.favorisParfums.length === initialLength) {
      return res.status(400).json({ message: "Parfum n'était pas en favoris" });
    }

    await user.save();

    console.log(`✅ Parfum ${parfumId} retiré des favoris de ${user.username}`);

    res.json({
      message: "Parfum retiré des favoris",
      favoriCount: user.favorisParfums.length,
    });
  } catch (error) {
    console.error("❌ Erreur removeFavoriteParfum:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Ajouter une note en favoris (inchangé)
export const addFavoriteNote = async (req, res) => {
  try {
    const userId = req.user._id;
    const noteId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ message: "ID de note invalide" });
    }

    console.log(`🏷️ Ajout favori note: ${noteId} pour user: ${userId}`);

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé" });

    const isAlreadyFavorite = user.favorisNotes.some(
      (id) => id.toString() === noteId
    );
    if (isAlreadyFavorite) {
      return res.status(400).json({ message: "Note déjà en favoris" });
    }

    user.favorisNotes.push(noteId);
    await user.save();

    console.log(`✅ Note ${noteId} ajoutée aux favoris de ${user.username}`);

    res.json({
      message: "Note ajoutée aux favoris",
      favoriCount: user.favorisNotes.length,
    });
  } catch (error) {
    console.error("❌ Erreur addFavoriteNote:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Retirer une note des favoris (inchangé)
export const removeFavoriteNote = async (req, res) => {
  try {
    const userId = req.user._id;
    const noteId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ message: "ID de note invalide" });
    }

    console.log(`🏷️ Suppression favori note: ${noteId} pour user: ${userId}`);

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé" });

    const initialLength = user.favorisNotes.length;
    user.favorisNotes = user.favorisNotes.filter(
      (id) => id.toString() !== noteId
    );

    if (user.favorisNotes.length === initialLength) {
      return res.status(400).json({ message: "Note n'était pas en favoris" });
    }

    await user.save();

    console.log(`✅ Note ${noteId} retirée des favoris de ${user.username}`);

    res.json({
      message: "Note retirée des favoris",
      favoriCount: user.favorisNotes.length,
    });
  } catch (error) {
    console.error("❌ Erreur removeFavoriteNote:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Récupérer tous les favoris (parfums + notes) (inchangé)
export const getUserFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("favorisParfums", "nom marque photo genre popularite")
      .populate(
        "favorisNotes",
        "nom famille suggestedPositions usages couleur"
      );

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    console.log(`📦 Favoris récupérés pour ${user.username}:`);
    console.log(`   Parfums: ${user.favorisParfums?.length || 0}`);
    console.log(`   Notes: ${user.favorisNotes?.length || 0}`);

    res.json({
      parfums: user.favorisParfums || [],
      notes: user.favorisNotes || [],
    });
  } catch (error) {
    console.error("❌ Erreur getUserFavorites:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ----------------------------- HISTORIQUE ----------------------------- */

// ✅ Ajout à l'historique (inchangé)
export const addToHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const parfumId = req.body?.parfumId || req.params?.id || req.body?.parfum;

    if (!parfumId) {
      return res
        .status(400)
        .json({ message: "parfumId requis (body) ou :id (params)" });
    }
    if (!mongoose.Types.ObjectId.isValid(parfumId)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    const [parfumExists, user] = await Promise.all([
      Parfum.findById(parfumId),
      User.findById(userId),
    ]);
    if (!parfumExists) {
      return res.status(404).json({ message: "Parfum non trouvé" });
    }
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Déduplication
    user.historique = (user.historique || []).filter(
      (h) => h.parfum.toString() !== parfumId
    );

    // Ajout en tête
    user.historique.unshift({
      parfum: parfumId,
      dateVisite: new Date(),
    });

    // Limite 50 (ajuste si illimité)
    if (user.historique.length > 50) {
      user.historique = user.historique.slice(0, 50);
    }

    await user.save();

    console.log(
      `✅ Parfum ${parfumId} ajouté à l'historique de ${user.username}`
    );
    console.log(`📊 Taille historique: ${user.historique.length}`);

    res.json({
      message: "Ajouté à l'historique",
      historiqueCount: user.historique.length,
    });
  } catch (error) {
    console.error("❌ Erreur addToHistory:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Lecture de l'historique (inchangé)
export const getUserHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const p = parseInt(page);
    const l = parseInt(limit);
    const skip = (p - 1) * l;

    const user = await User.findById(req.user._id).populate(
      "historique.parfum",
      "nom marque photo genre popularite"
    );

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Exclure les parfums supprimés et paginer
    const validHistorique = (user.historique || [])
      .filter((h) => h.parfum)
      .slice(skip, skip + l)
      .map((h) => ({
        parfum: h.parfum,
        viewedAt: h.dateVisite || h.consultedAt || null,
      }));

    console.log(
      `📖 Historique récupéré pour ${user.username}: ${validHistorique.length} entrées`
    );

    res.json(validHistorique);
  } catch (error) {
    console.error("❌ Erreur getUserHistory:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Vider l'historique (inchangé)
export const clearHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const historyCount = user.historique.length;
    user.historique = [];
    await user.save();

    console.log(
      `🗑️ Historique vidé pour ${user.username} (${historyCount} entrées)`
    );

    res.json({ message: "Historique effacé" });
  } catch (error) {
    console.error("❌ Erreur clearHistory:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ------------------------------- ADMIN ------------------------------- */

// ✅ Suppression du compte utilisateur (modification pour supprimer le cookie)
export const deleteUser = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    if (!me) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    await User.findByIdAndDelete(req.user._id);

    // Supprimer le cookie lors de la suppression du compte
    res.cookie("authToken", "", {
      ...getCookieOptions(),
      expires: new Date(0),
    });

    res.json({ message: "Compte utilisateur supprimé" });
  } catch (error) {
    console.error("❌ Erreur deleteUser:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Statistiques utilisateurs (inchangé)
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ isAdmin: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    res.json({
      totalUsers,
      adminUsers,
      verifiedUsers,
      recentUsers,
      regularUsers: totalUsers - adminUsers,
    });
  } catch (error) {
    console.error("❌ Erreur getUserStats:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Liste des utilisateurs (pagination + recherche) (inchangé)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const p = parseInt(page);
    const l = parseInt(limit);
    const skip = (p - 1) * l;

    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .skip(skip)
        .limit(l)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: {
        page: p,
        limit: l,
        total,
        pages: Math.ceil(total / l),
      },
    });
  } catch (error) {
    console.error("❌ Erreur getAllUsers:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Export CSV (inchangé)
export const exportUsersCSV = async (req, res) => {
  try {
    const users = await User.find().select("-password").lean();
    const csv = await csvService.exportUsers(users);

    res.header("Content-Type", "text/csv");
    res.attachment("users.csv");
    res.send(csv);
  } catch (error) {
    console.error("❌ Erreur exportUsersCSV:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Toggle admin (inchangé)
export const toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    user.isAdmin = !user.isAdmin;
    await user.save();

    res.json({
      message: `Statut admin ${user.isAdmin ? "activé" : "désactivé"}`,
      user: {
        id: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("❌ Erreur toggleAdminStatus:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
