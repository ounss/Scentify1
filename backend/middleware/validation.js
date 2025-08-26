import { body, param, validationResult } from "express-validator";
import mongoose from "mongoose";

// Validation ObjectId MongoDB
export const validateObjectId = [
  param("id").custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error("ID invalide");
    }
    return true;
  }),
];
export const validateRegister = [
  body("username")
    .isLength({ min: 3, max: 20 })
    .withMessage("Le nom d'utilisateur doit contenir entre 3 et 20 caractères")
    .isAlphanumeric()
    .withMessage(
      "Le nom d'utilisateur ne peut contenir que des lettres et des chiffres"
    ),

  body("email").isEmail().withMessage("Email invalide").normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Le mot de passe doit contenir au moins 6 caractères")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
    ),
];

export const validateLogin = [
  body("email").isEmail().withMessage("Email invalide").normalizeEmail(),
  body("password").notEmpty().withMessage("Mot de passe requis"),
];

export const validateResetPassword = [
  body("token").notEmpty().withMessage("Token requis"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Le mot de passe doit contenir au moins 6 caractères")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
    ),
];

export const validateParfum = [
  body("nom")
    .isLength({ min: 2, max: 100 })
    .withMessage("Le nom du parfum doit contenir entre 2 et 100 caractères"),

  body("marque")
    .isLength({ min: 2, max: 50 })
    .withMessage("La marque doit contenir entre 2 et 50 caractères"),

  body("genre")
    .isIn(["homme", "femme", "mixte"])
    .withMessage("Le genre doit être: homme, femme ou mixte"),

  body("notes")
    .isArray({ min: 1 })
    .withMessage("Au moins une note olfactive est requise"),
];

export const validateNote = [
  body("nom")
    .isLength({ min: 2, max: 50 })
    .withMessage("Le nom de la note doit contenir entre 2 et 50 caractères"),

  body("type")
    .isIn(["tête", "cœur", "fond"])
    .withMessage("Le type doit être: tête, cœur ou fond"),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Données invalides",
      errors: errors.array(),
    });
  }
  next();
};
