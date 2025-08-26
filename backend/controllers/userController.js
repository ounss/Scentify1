import User from "../models/User.js";
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
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("favorisParfums", "nom marque photo genre")
      .populate("favorisNotes", "nom type")
      .populate("historique.parfum", "nom marque photo genre");

    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        photo: user.photo,
        isAdmin: user.isAdmin,
        favorisParfums: user.favorisParfums,
        favorisNotes: user.favorisNotes,
        historique: user.historique,
        preferences: user.preferences,
        favoriCount: user.favoriCount,
        historiqueCount: user.historiqueCount,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404).json({ message: "Utilisateur non trouvé" });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
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
    } else {
      res.status(404).json({ message: "Utilisateur non trouvé" });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const addFavoriteParfum = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const parfumId = req.params.id;

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    await user.addFavoriParfum(parfumId);
    res.json({ message: "Parfum ajouté aux favoris" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const removeFavoriteParfum = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const parfumId = req.params.id;

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    await user.removeFavoriParfum(parfumId);
    res.json({ message: "Parfum retiré des favoris" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const addFavoriteNote = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const noteId = req.params.id;

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    await user.addFavoriNote(noteId);
    res.json({ message: "Note ajoutée aux favoris" });
  } catch (error) {
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

    res.json({
      parfums: user.favorisParfums,
      notes: user.favorisNotes,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const addToHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const parfumId = req.params.id;

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    await user.addToHistorique(parfumId);
    res.json({ message: "Ajouté à l'historique" });
  } catch (error) {
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

    const historique = user.historique
      .slice(skip, skip + parseInt(limit))
      .filter((h) => h.parfum)
      .map((h) => ({
        parfum: h.parfum,
        viewedAt: h.dateVisite,
      }));

    res.json(historique);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const clearHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    await user.clearHistorique();
    res.json({ message: "Historique effacé" });
  } catch (error) {
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
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
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
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
