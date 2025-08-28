import User from "../models/User.js";
import Parfum from "../models/Parfum.js"; // ✅ Import ajouté
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import emailService from "../services/emailService.js";
import csvService from "../services/csvService.js";
import crypto from "crypto";
import mongoose from "mongoose";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Vérification email (fonction manquante ajoutée)
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // Simple validation pour le moment - à développer selon vos besoins
    if (!token) {
      return res.status(400).json({ message: "Token requis" });
    }

    res.json({
      message: "Email vérifié avec succès",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Inscription simplifiée (auto-vérifiée)
export const registerUser = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const user = await User.create({
      email,
      password,
      username,
      isVerified: true, // Auto-vérifié pour simplifier la phase 1
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: "Utilisateur créé avec succès",
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
    console.error("Erreur registerUser:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Connexion simplifiée
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

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

// Mot de passe oublié
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
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

// Reset mot de passe
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Mot de passe réinitialisé" });
  } catch (error) {
    console.error("Erreur resetPassword:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

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

// ✅ FAVORIS - CORRECTION URGENTE
export const addFavoriteParfum = async (req, res) => {
  try {
    const userId = req.user._id;
    const parfumId = req.params.id;

    // ✅ Validation ObjectId
    if (!mongoose.Types.ObjectId.isValid(parfumId)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    console.log(`💝 Ajout favori parfum: ${parfumId} pour user: ${userId}`);

    // ✅ Vérifier que le parfum existe
    const parfumExists = await Parfum.findById(parfumId);
    if (!parfumExists) {
      return res.status(404).json({ message: "Parfum non trouvé" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // ✅ Vérifier si déjà en favori
    const isAlreadyFavorite = user.favorisParfums.some(
      (id) => id.toString() === parfumId
    );
    if (isAlreadyFavorite) {
      return res.status(400).json({ message: "Parfum déjà en favoris" });
    }

    // ✅ Ajouter aux favoris
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

export const removeFavoriteParfum = async (req, res) => {
  try {
    const userId = req.user._id;
    const parfumId = req.params.id;

    // ✅ Validation ObjectId
    if (!mongoose.Types.ObjectId.isValid(parfumId)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    console.log(
      `💝 Suppression favori parfum: ${parfumId} pour user: ${userId}`
    );

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // ✅ Supprimer des favoris
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

export const addFavoriteNote = async (req, res) => {
  try {
    const userId = req.user._id;
    const noteId = req.params.id;

    // ✅ Validation ObjectId
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ message: "ID de note invalide" });
    }

    console.log(`🏷️ Ajout favori note: ${noteId} pour user: ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // ✅ Vérifier si déjà en favori
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

export const removeFavoriteNote = async (req, res) => {
  try {
    const userId = req.user._id;
    const noteId = req.params.id;

    // ✅ Validation ObjectId
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ message: "ID de note invalide" });
    }

    console.log(`🏷️ Suppression favori note: ${noteId} pour user: ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

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

// ✅ HISTORIQUE - CORRECTION URGENTE
export const addToHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const parfumId = req.params.id;

    // ✅ Validation ObjectId
    if (!mongoose.Types.ObjectId.isValid(parfumId)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    console.log(`📖 Ajout à l'historique: ${parfumId} pour user: ${userId}`);

    // ✅ Vérifier que le parfum existe
    const parfumExists = await Parfum.findById(parfumId);
    if (!parfumExists) {
      return res.status(404).json({ message: "Parfum non trouvé" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // ✅ Supprimer l'entrée existante si elle existe
    user.historique = user.historique.filter(
      (h) => h.parfum.toString() !== parfumId
    );

    // ✅ Ajouter au début de l'historique
    user.historique.unshift({
      parfum: parfumId,
      dateVisite: new Date(),
    });

    // ✅ Limiter l'historique à 50 entrées
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

export const getUserHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id).populate(
      "historique.parfum",
      "nom marque photo genre popularite"
    );

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // ✅ Filtrer les entrées avec parfums supprimés
    const validHistorique = user.historique
      .filter((h) => h.parfum) // Exclure les parfums supprimés
      .slice(skip, skip + parseInt(limit))
      .map((h) => ({
        parfum: h.parfum,
        viewedAt: h.dateVisite,
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

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Compte utilisateur supprimé" });
  } catch (error) {
    console.error("❌ Erreur deleteUser:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

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

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Erreur getAllUsers:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

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
