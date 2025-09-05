// backend/models/NoteOlfactive.js - VERSION REFACTORISÉE
import mongoose from "mongoose";

const NoteOlfactiveSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },

    // ❌ SUPPRIMÉ : plus de champ "type" fixe
    // type: { type: String, enum: ["tête", "cœur", "fond"] },

    famille: {
      type: String,
      enum: [
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
        "résineuse",
      ],
      required: true,
    },

    description: {
      type: String,
      maxlength: 500,
    },

    // ✅ NOUVEAU : informations sur les usages typiques
    usages: {
      tete: {
        frequence: { type: Number, default: 0 }, // Nb de fois utilisée en tête
        populaire: { type: Boolean, default: false }, // Populaire en tête ?
      },
      coeur: {
        frequence: { type: Number, default: 0 },
        populaire: { type: Boolean, default: false },
      },
      fond: {
        frequence: { type: Number, default: 0 },
        populaire: { type: Boolean, default: false },
      },
    },

    // ✅ NOUVEAU : suggestions d'usage par défaut
    suggestedPositions: [
      {
        type: String,
        enum: ["tête", "cœur", "fond"],
      },
    ],

    // Métadonnées utiles
    intensite: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },

    popularite: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    couleur: {
      type: String,
      default: "#4a90e2", // Couleur pour l'affichage
    },

    synonymes: [String], // Pour la recherche

    // Statistiques automatiques
    stats: {
      nombreParfums: { type: Number, default: 0 },
      derniereUtilisation: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ Index pour la recherche et performance
NoteOlfactiveSchema.index({ nom: 1 });
NoteOlfactiveSchema.index({ famille: 1 });
NoteOlfactiveSchema.index({ popularite: -1 });
NoteOlfactiveSchema.index({ nom: "text", synonymes: "text" });

// ✅ Virtual pour obtenir la position la plus fréquente
NoteOlfactiveSchema.virtual("positionPreferee").get(function () {
  const { tete, coeur, fond } = this.usages;
  const max = Math.max(tete.frequence, coeur.frequence, fond.frequence);

  if (max === 0) return null;
  if (tete.frequence === max) return "tête";
  if (coeur.frequence === max) return "cœur";
  return "fond";
});

// ✅ Méthode pour mettre à jour les statistiques d'usage
NoteOlfactiveSchema.methods.updateUsage = function (position) {
  if (!["tête", "cœur", "fond"].includes(position)) return;

  const key =
    position === "tête" ? "tete" : position === "cœur" ? "coeur" : "fond";
  this.usages[key].frequence += 1;

  // Marquer comme populaire si utilisée plus de 10 fois dans cette position
  if (this.usages[key].frequence >= 10) {
    this.usages[key].populaire = true;
  }

  this.stats.derniereUtilisation = new Date();
  return this.save();
};

// ✅ Méthode statique pour recherche avancée
NoteOlfactiveSchema.statics.searchWithSuggestions = function (query = {}) {
  const { search, famille, position, populaire } = query;

  const mongoQuery = {};

  if (search) {
    mongoQuery.$or = [
      { nom: { $regex: search, $options: "i" } },
      { synonymes: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (famille) {
    mongoQuery.famille = famille;
  }

  if (position) {
    const key =
      position === "tête" ? "tete" : position === "cœur" ? "coeur" : "fond";
    mongoQuery[`usages.${key}.populaire`] = true;
  }

  if (populaire === "true") {
    mongoQuery.popularite = { $gte: 50 };
  }

  return this.find(mongoQuery).sort({ popularite: -1, nom: 1 });
};

export default mongoose.model("NoteOlfactive", NoteOlfactiveSchema);
