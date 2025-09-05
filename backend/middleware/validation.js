// backend/middleware/validation.js - VALIDATION REFACTORISÉE
import Joi from "joi";

// ✅ SCHÉMA DE VALIDATION POUR LES NOTES REFACTORISÉ
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

  description: Joi.string().max(500).allow("").messages({
    "string.max": "La description ne peut pas dépasser 500 caractères",
  }),

  // ✅ NOUVEAU : Positions suggérées au lieu d'un type fixe
  suggestedPositions: Joi.array()
    .items(Joi.string().valid("tête", "cœur", "fond"))
    .default([])
    .messages({
      "array.includes": "Position suggérée invalide (tête, cœur ou fond)",
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

  synonymes: Joi.array().items(Joi.string().max(50)).default([]).messages({
    "array.includes":
      "Les synonymes doivent être des chaînes de caractères de moins de 50 caractères",
  }),

  // ❌ SUPPRIMÉ : Plus de validation pour le champ "type"
  // type: Joi.string().valid('tête', 'cœur', 'fond').required(),

  // ✅ Les champs de statistiques ne sont pas validés car ils sont gérés automatiquement
  // usages, stats sont exclus de la validation manuelle
});

// Middleware de validation pour les notes
export const validateNote = (req, res, next) => {
  const { error, value } = noteSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false, // Rejeter les champs non définis
    stripUnknown: true, // Supprimer les champs non définis
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    return res.status(422).json({
      message: "Données de validation invalides",
      errors,
    });
  }

  // Remplacer le body par les données validées
  req.body = value;
  next();
};

// ✅ SCHÉMA PARFUM AUSSI MIS À JOUR (si nécessaire)
const parfumSchema = Joi.object({
  nom: Joi.string().min(2).max(100).required(),
  marque: Joi.string().min(2).max(50).required(),
  genre: Joi.string().valid("femme", "homme", "mixte").required(),
  description: Joi.string().max(1000).allow(""),

  // ✅ Validation des notes par position
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
  anneSortie: Joi.number()
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

export const validateParfum = (req, res, next) => {
  // Traitement spécial pour multipart/form-data
  const data = { ...req.body };

  // Conversion des arrays depuis les form-data
  ["notes_tete", "notes_coeur", "notes_fond"].forEach((field) => {
    if (data[field]) {
      data[field] = Array.isArray(data[field]) ? data[field] : [data[field]];
    }
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

  const { error, value } = parfumSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    return res.status(422).json({
      message: "Données de validation invalides",
      errors,
    });
  }

  req.validatedData = value;
  next();
};
