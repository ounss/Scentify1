import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    photo: String,
    favorisParfums: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parfum",
      },
    ],
    favorisNotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NoteOlfactive",
      },
    ],
    historique: [
      {
        parfum: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Parfum",
        },
        dateVisite: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    preferences: {
      genrePreference: {
        type: String,
        enum: ["homme", "femme", "mixte"],
        default: "mixte",
      },
      famillesPreferees: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password avant sauvegarde
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Comparer les mots de passe
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Méthodes pour les favoris (garder toutes les méthodes existantes)
UserSchema.methods.addFavoriParfum = async function (parfumId) {
  if (!this.favorisParfums.includes(parfumId)) {
    this.favorisParfums.push(parfumId);
    await this.save();
  }
  return this;
};

UserSchema.methods.removeFavoriParfum = async function (parfumId) {
  this.favorisParfums = this.favorisParfums.filter(
    (id) => !id.equals(parfumId)
  );
  await this.save();
  return this;
};

UserSchema.methods.addFavoriNote = async function (noteId) {
  if (!this.favorisNotes.includes(noteId)) {
    this.favorisNotes.push(noteId);
    await this.save();
  }
  return this;
};

UserSchema.methods.addToHistorique = async function (parfumId) {
  this.historique = this.historique.filter((h) => !h.parfum.equals(parfumId));
  this.historique.unshift({
    parfum: parfumId,
    dateVisite: new Date(),
  });

  if (this.historique.length > 50) {
    this.historique = this.historique.slice(0, 50);
  }

  await this.save();
  return this;
};

UserSchema.methods.clearHistorique = async function () {
  this.historique = [];
  await this.save();
  return this;
};

// Virtuels
UserSchema.virtual("favoriCount").get(function () {
  return this.favorisParfums.length + this.favorisNotes.length;
});

UserSchema.virtual("historiqueCount").get(function () {
  return this.historique.length;
});

UserSchema.set("toJSON", { virtuals: true });

const User = mongoose.model("User", UserSchema);
export default User;
