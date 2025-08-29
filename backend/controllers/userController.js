// controllers/userController.js (ou chemin équivalent)
// ✅ Version complète avec historique corrigé

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

// ✅ Inscription simplifiée (auto-vérifiée en phase 1)
// backend/controllers/userController.js - MODIFIER registerUser
export const registerUser = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    const user = await User.create({
      email,
      password,
      username,
      isVerified: false, // ⚠️ CHANGEMENT: par défaut non vérifié
      emailVerificationToken: crypto.randomBytes(32).toString("hex"),
    });

    // Envoyer email de vérification
    await emailService.sendVerificationEmail(user, user.emailVerificationToken);

    res.status(201).json({
      message: "Compte créé. Vérifiez votre email pour l'activer.",
      user: {
        /* données publiques */
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Ajouter route de vérification
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res.status(400).json({ message: "Token invalide" });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ message: "Email vérifié avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
// ✅ Connexion
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

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Erreur loginUser:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Mot de passe oublié
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

// ✅ Reset mot de passe
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

// ✅ Profil utilisateur
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

// ✅ Mise à jour profil
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

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

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      photo: updatedUser.photo,
      isAdmin: updatedUser.isAdmin,
      preferences: updatedUser.preferences,
      createdAt: updatedUser.createdAt,
    });
  } catch (error) {
    console.error("Erreur updateUserProfile:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ------------------------------ FAVORIS ------------------------------ */

// ✅ Ajouter un parfum aux favoris
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

// ✅ Retirer un parfum des favoris
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

// ✅ Ajouter une note en favoris
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

// ✅ Retirer une note des favoris
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

// ✅ Récupérer tous les favoris (parfums + notes)
export const getUserFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("favorisParfums", "nom marque photo genre popularite")
      .populate("favorisNotes", "nom type famille");

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

// ✅ Ajout à l'historique (compat params/body, déduplication, dateVisite)
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

// ✅ Lecture de l'historique (tolère dateVisite || consultedAt)
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

// ✅ Vider l'historique
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

// ✅ Suppression du compte utilisateur
export const deleteUser = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    if (!me) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Compte utilisateur supprimé" });
  } catch (error) {
    console.error("❌ Erreur deleteUser:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Statistiques utilisateurs (simples)
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

// ✅ Liste des utilisateurs (pagination + recherche)
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

// ✅ Export CSV
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

// ✅ Toggle admin
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
