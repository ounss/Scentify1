// backend/middleware/validation.js - VERSION COMPLÈTE CORRIGÉE
import Joi from "joi";

// ✅ SCHÉMA DE VALIDATION POUR LES NOTES CORRIGÉ
const noteSchema = Joi.object({
  nom: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Le nom de la note est requis",
    "string.min": "Le nom doit contenir au moins 2 caractères",
    "string.max": "Le nom ne peut pas dépasser 100 caractères",
  }),

  famille: Joi.string()
    .valid(
      "agrumes",
      "florale",
      "fruitée",
      "verte",
      "aromatique",
      "épicée",
      "boisée",
      "orientale",
      "ambrée",
      "musquée",
      "animale",
      "poudrée",
      "gourmande",
      "marine",
      "aldéhydée",
      "cuirée",
      "fumée",
      "résineuse"
    )
    .required()
    .messages({
      "any.only": "Famille olfactive invalide",
      "any.required": "La famille olfactive est requise",
    }),

  description: Joi.string().max(500).allow("").optional().messages({
    "string.max": "La description ne peut pas dépasser 500 caractères",
  }),

  // ✅ CORRIGÉ: Positions suggérées (au moins une requise)
  suggestedPositions: Joi.array()
    .items(Joi.string().valid("tête", "cœur", "fond"))
    .min(1) // Au moins une position requise
    .required()
    .messages({
      "array.includes": "Position suggérée invalide (tête, cœur ou fond)",
      "array.min": "Au moins une position suggérée est requise",
      "any.required": "Au moins une position suggérée est requise",
    }),

  intensite: Joi.number().integer().min(1).max(10).default(5).messages({
    "number.base": "L'intensité doit être un nombre",
    "number.min": "L'intensité doit être entre 1 et 10",
    "number.max": "L'intensité doit être entre 1 et 10",
  }),

  popularite: Joi.number().integer().min(0).max(100).default(0).messages({
    "number.base": "La popularité doit être un nombre",
    "number.min": "La popularité doit être entre 0 et 100",
    "number.max": "La popularité doit être entre 0 et 100",
  }),

  couleur: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .default("#4a90e2")
    .messages({
      "string.pattern.base":
        "La couleur doit être un code hexadécimal valide (#RRGGBB)",
    }),

  synonymes: Joi.array()
    .items(Joi.string().max(50))
    .default([])
    .optional()
    .messages({
      "array.includes":
        "Les synonymes doivent être des chaînes de moins de 50 caractères",
    }),

  // ✅ IMPORTANT: Permettre les champs auto-gérés mais les ignorer
  usages: Joi.any().optional(),
  stats: Joi.any().optional(),
  _id: Joi.any().optional(),
  createdAt: Joi.any().optional(),
  updatedAt: Joi.any().optional(),
  __v: Joi.any().optional(),
});

// ✅ SCHÉMA PARFUM CORRIGÉ
const parfumSchema = Joi.object({
  nom: Joi.string().min(2).max(100).required(),
  marque: Joi.string().min(2).max(50).required(),
  genre: Joi.string().valid("femme", "homme", "mixte").required(),
  description: Joi.string().max(1000).allow(""),

  // Validation des notes par position
  notes_tete: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .default([]),
  notes_coeur: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .default([]),
  notes_fond: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .default([]),

  prix: Joi.number().min(0).allow(null),
  anneeSortie: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  concentre: Joi.string()
    .valid("EDT", "EDP", "EDC", "Parfum", "Autre")
    .default("EDT"),
  popularite: Joi.number().integer().min(0).max(100).default(0),
  longevite: Joi.string().allow(""),
  sillage: Joi.string().allow(""),

  liensMarchands: Joi.array()
    .items(
      Joi.object({
        nom: Joi.string().required(),
        url: Joi.string().uri().required(),
        prix: Joi.number().min(0).allow(null),
      })
    )
    .default([]),

  imageUrl: Joi.string().uri().allow(""),
});

// ✅ SCHÉMAS AUTH
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ===== MIDDLEWARES DE VALIDATION =====

// ✅ CORRIGÉ: Middleware de validation notes
export const validateNote = (req, res, next) => {
  console.log("🔍 Validation note - données reçues:", req.body);

  const { error, value } = noteSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true, // ✅ CHANGÉ: Permettre les champs inconnus
    stripUnknown: true, // Les retirer silencieusement
  });

  if (error) {
    console.error("❌ Erreur validation note:", error.details);

    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    return res.status(422).json({
      message: "Données de validation invalides",
      errors,
      received: req.body, // DEBUG: montrer ce qui a été reçu
    });
  }

  // Stocker les données validées
  req.body = value;
  console.log("✅ Validation note réussie:", value);

  next();
};

// ✅ Middleware de validation parfums
export const validateParfum = (req, res, next) => {
  // Traitement spécial pour multipart/form-data
  const data = { ...req.body };

  console.log("🔍 DEBUG validation - req.body reçu:", Object.keys(req.body));
  console.log("🔍 DEBUG validation - req.body complet:", req.body);

  // Conversion des arrays depuis les form-data
  ["notes_tete", "notes_coeur", "notes_fond"].forEach((field) => {
    // Cas 1: Array indexé depuis FormData notes_tete[0], notes_tete[1], etc.
    const indexedNotes = [];
    let i = 0;
    while (req.body[`${field}[${i}]`]) {
      indexedNotes.push(req.body[`${field}[${i}]`]);
      i++;
    }

    if (indexedNotes.length > 0) {
      data[field] = indexedNotes;
    }
    // Cas 2: Array direct (si c'était déjà un array)
    else if (data[field]) {
      data[field] = Array.isArray(data[field]) ? data[field] : [data[field]];
    }
    // Cas 3: Aucune note pour cette position
    else {
      data[field] = [];
    }

    console.log(`✅ ${field} traité:`, data[field]);
  });

  // Reconstruction des liens marchands
  if (req.body) {
    const liens = [];
    let i = 0;
    while (req.body[`liensMarchands[${i}][nom]`]) {
      liens.push({
        nom: req.body[`liensMarchands[${i}][nom]`],
        url: req.body[`liensMarchands[${i}][url]`],
        prix: req.body[`liensMarchands[${i}][prix]`] || null,
      });
      i++;
    }
    if (liens.length > 0) {
      data.liensMarchands = liens;
    }
  }

  // Conversion des champs numériques depuis FormData
  if (data.anneeSortie && typeof data.anneeSortie === "string") {
    data.anneeSortie = parseInt(data.anneeSortie);
  }
  if (data.popularite && typeof data.popularite === "string") {
    data.popularite = parseInt(data.popularite);
  }
  if (data.prix && typeof data.prix === "string") {
    data.prix = parseFloat(data.prix);
  }

  console.log("🔍 DEBUG validation - data final avant validation:", data);

  const { error, value } = parfumSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    console.error("❌ Erreur validation Joi:", error.details);

    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    return res.status(422).json({
      message: "Données de validation invalides",
      errors,
    });
  }

  // Stocker les données validées
  req.validatedData = value;
  console.log("✅ Validation réussie, données validées:", value);

  next();
};

// ✅ Middleware de validation register
export const validateRegister = (req, res, next) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(422).json({
      message: "Données invalides",
      errors: error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      })),
    });
  }
  req.body = value;
  next();
};

// ✅ Middleware de validation login
export const validateLogin = (req, res, next) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(422).json({
      message: "Données invalides",
      errors: error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      })),
    });
  }
  req.body = value;
  next();
};

// ✅ Middleware générique pour gestion d'erreurs
export const handleValidationErrors = (req, res, next) => {
  next();
};
