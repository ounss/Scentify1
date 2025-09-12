// backend/models/Parfum.js - modèle aligné + liens marchands
import mongoose from "mongoose";

const { Schema } = mongoose;

const LienMarchandSchema = new Schema(
  {
    nom: {
      type: String,
      required: true,
      enum: [
        "Le Labo",
        "Ici Paris XL",
        "Sephora",
        "Deloox",
        "Douglas",
        "Marionnaud",
        "Nocibé",
        "Amazon",
        "Origines Parfums",
        "Parfums de Marly",
        "Fragonard",
        "Galeries Lafayette",
        "Printemps",
        "Site Officiel",
        "Autre",
      ],
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          const urlPattern =
            /^https?:\/\/([\da-z.-]+)\.([a-z.]{2,})([\/\w.-]*)*\/?(\?[;&a-z\d%_.~+=-]*)?(#[-a-z\d_]*)?$/i;
          return urlPattern.test(v);
        },
        message:
          "URL invalide - doit être une URL complète (ex: https://www.example.com)",
      },
    },
    prix: {
      type: Number,
      min: [0, "Le prix ne peut pas être négatif"],
      max: [9999.99, "Prix trop élevé"],
      validate: {
        validator: function (v) {
          return (
            v === null ||
            v === undefined ||
            (typeof v === "number" &&
              Number.isFinite(v) &&
              v >= 0 &&
              Math.round(v * 100) === v * 100)
          );
        },
        message: "Prix invalide (max 2 décimales)",
      },
    },
    devise: {
      type: String,
      default: "EUR",
      enum: {
        values: ["EUR", "USD", "GBP", "CHF", "CAD"],
        message: "Devise non supportée",
      },
    },
    taille: {
      type: String,
      validate: {
        validator: (v) => !v || /^\d+(\.\d+)?(ml|L)$/i.test(v),
        message: "Format de taille invalide (ex: 50ml, 100ml, 1L)",
      },
    },
    disponible: { type: Boolean, default: true },
    enPromotion: { type: Boolean, default: false },
    prixOriginal: {
      type: Number,
      min: 0,
      validate: {
        validator: function (v) {
          if (this.enPromotion && v && this.prix) return v > this.prix;
          return true;
        },
        message: "Le prix original doit être supérieur au prix promotionnel",
      },
    },
    dateVerification: { type: Date, default: Date.now },
    // Livraison
    fraisLivraison: { type: Number, min: 0, default: null },
    delaiLivraison: { type: String, maxlength: 50 },
    // Qualité
    noteQualite: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "La note doit être un entier entre 1 et 5",
      },
    },
    commentaire: { type: String, maxlength: 200, trim: true },
  },
  { _id: false }
);

const ParfumSchema = new Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    marque: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    genre: {
      type: String,
      enum: ["homme", "femme", "mixte"],
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    /* -------------------- LIEN AVEC LES NOTES (ObjectId) -------------------- */
    notes_tete: [
      {
        type: Schema.Types.ObjectId,
        ref: "NoteOlfactive",
      },
    ],
    notes_coeur: [
      {
        type: Schema.Types.ObjectId,
        ref: "NoteOlfactive",
      },
    ],
    notes_fond: [
      {
        type: Schema.Types.ObjectId,
        ref: "NoteOlfactive",
      },
    ],

    photo: { type: String, default: null },
    popularite: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Liens marchands
    liensMarchands: [LienMarchandSchema],

    codeBarres: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: (v) => !v || /^\d{12,13}$/.test(v),
        message: "Code-barres invalide (12 ou 13 chiffres requis)",
      },
    },

    // Prix principal (moyen / de référence)
    prix: {
      type: Number,
      min: 0,
      validate: {
        validator: (v) =>
          v === null ||
          v === undefined ||
          (typeof v === "number" &&
            v >= 0 &&
            Number.isFinite(v) &&
            Math.round(v * 100) === v * 100),
        message: "Prix invalide",
      },
    },

    // Métadonnées
    meilleurPrix: { type: Number, min: 0 },
    nombreLiensMarchands: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* -------------------------------- Indexes -------------------------------- */
ParfumSchema.index({ nom: "text", marque: "text", description: "text" });
ParfumSchema.index({ genre: 1 });
ParfumSchema.index({ marque: 1 });
ParfumSchema.index({ popularite: -1 });
ParfumSchema.index({ notes_tete: 1 });
ParfumSchema.index({ notes_coeur: 1 });
ParfumSchema.index({ notes_fond: 1 });
ParfumSchema.index({ "liensMarchands.prix": 1 });
ParfumSchema.index({ meilleurPrix: 1 });

/* -------------------------- Hooks / Pré-traitements ------------------------- */
ParfumSchema.pre("save", function (next) {
  if (Array.isArray(this.liensMarchands) && this.liensMarchands.length > 0) {
    const prixDisponibles = this.liensMarchands
      .filter(
        (lien) =>
          lien.disponible && typeof lien.prix === "number" && lien.prix > 0
      )
      .map((lien) => lien.prix);

    this.meilleurPrix = prixDisponibles.length
      ? Math.min(...prixDisponibles)
      : undefined;

    this.nombreLiensMarchands = this.liensMarchands.length;

    if (!this.prix && this.meilleurPrix) this.prix = this.meilleurPrix;
  }
  next();
});
// backend/models/Parfum.js - Ajoutez ces hooks à la fin de votre fichier

import NoteOlfactive from "./NoteOlfactive.js";

// Hook après sauvegarde d'un parfum (création ou modification)
ParfumSchema.post("save", async function (doc) {
  await updateNoteStatistics(doc);
});

// Hook après suppression d'un parfum
ParfumSchema.post("findOneAndDelete", async function (doc, next) {
  try {
    if (doc) {
      console.log(`🗑️ Recalcul des stats après suppression: ${doc.nom}`);
      await updateNoteStatistics(doc);
    }
    next();
  } catch (error) {
    console.error("❌ Erreur recalcul stats après suppression:", error);
    next();
  }
});

// Hook après mise à jour d'un parfum
ParfumSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    await updateNoteStatistics(doc);
  }
});

// Fonction pour mettre à jour les statistiques des notes
async function updateNoteStatistics(parfum) {
  try {
    // Collecter toutes les notes utilisées dans ce parfum
    const allNoteIds = new Set([
      ...(parfum.notes_tete || []).map((id) => id.toString()),
      ...(parfum.notes_coeur || []).map((id) => id.toString()),
      ...(parfum.notes_fond || []).map((id) => id.toString()),
    ]);

    console.log(`📊 Recalcul pour ${allNoteIds.size} notes`);

    // Mettre à jour les statistiques pour chaque note concernée
    for (const noteId of allNoteIds) {
      await recalculateNoteStats(noteId);
    }

    console.log(`✅ Stats mises à jour pour ${allNoteIds.size} notes`);
  } catch (error) {
    console.error("❌ Erreur updateNoteStatistics:", error);
  }
}

// Fonction pour recalculer les stats d'une note spécifique
async function recalculateNoteStats(noteId) {
  try {
    const Parfum = mongoose.model("Parfum");

    // Compter les usages par position
    const teteCount = await Parfum.countDocuments({ notes_tete: noteId });
    const coeurCount = await Parfum.countDocuments({ notes_coeur: noteId });
    const fondCount = await Parfum.countDocuments({ notes_fond: noteId });

    const totalUsage = teteCount + coeurCount + fondCount;

    // Déterminer les positions suggérées (fréquence >= 3)
    const suggestedPositions = [];
    if (teteCount >= 3) suggestedPositions.push("tête");
    if (coeurCount >= 3) suggestedPositions.push("cœur");
    if (fondCount >= 3) suggestedPositions.push("fond");

    // Si aucune position fréquente, garder celle avec le plus d'usage
    if (suggestedPositions.length === 0 && totalUsage > 0) {
      const maxUsage = Math.max(teteCount, coeurCount, fondCount);
      if (teteCount === maxUsage) suggestedPositions.push("tête");
      else if (coeurCount === maxUsage) suggestedPositions.push("cœur");
      else suggestedPositions.push("fond");
    }

    // Mettre à jour la note
    await NoteOlfactive.findByIdAndUpdate(noteId, {
      usages: {
        tete: {
          frequence: teteCount,
          populaire: teteCount >= 10,
        },
        coeur: {
          frequence: coeurCount,
          populaire: coeurCount >= 10,
        },
        fond: {
          frequence: fondCount,
          populaire: fondCount >= 10,
        },
      },
      suggestedPositions: suggestedPositions,
      "stats.nombreParfums": totalUsage,
      "stats.derniereUtilisation": totalUsage > 0 ? new Date() : undefined,
    });

    console.log(
      `📈 Note ${noteId}: T:${teteCount} C:${coeurCount} F:${fondCount}`
    );
  } catch (error) {
    console.error(`❌ Erreur recalcul note ${noteId}:`, error);
  }
}

/* -------------------------------- Méthodes -------------------------------- */
ParfumSchema.methods.incrementPopularite = function () {
  this.popularite += 1;
  return this.save();
};

ParfumSchema.methods.getLiensValides = function () {
  return (this.liensMarchands || []).filter(
    (lien) => lien.disponible && lien.url && !this.isLienExpire(lien)
  );
};

ParfumSchema.methods.isLienExpire = function (lien) {
  if (!lien?.dateVerification) return false;
  const maintenant = new Date();
  const diffJours =
    (maintenant - new Date(lien.dateVerification)) / (1000 * 60 * 60 * 24);
  return diffJours > 30;
};

ParfumSchema.methods.getPrixAffiche = function (lien) {
  if (lien.enPromotion && lien.prixOriginal) {
    const reduction = Math.round(
      ((lien.prixOriginal - lien.prix) / lien.prixOriginal) * 100
    );
    return {
      prix: lien.prix,
      prixOriginal: lien.prixOriginal,
      reduction,
      enPromotion: true,
    };
  }
  return { prix: lien.prix, enPromotion: false };
};

/* ------------------------------ Méthodes statiques ------------------------------ */
ParfumSchema.statics.findByPriceRange = function (minPrix, maxPrix) {
  return this.find({
    meilleurPrix: {
      $gte: minPrix ?? 0,
      $lte: maxPrix ?? Number.MAX_SAFE_INTEGER,
    },
  });
};

ParfumSchema.statics.findWithValidLinks = function () {
  return this.find({
    "liensMarchands.disponible": true,
    nombreLiensMarchands: { $gt: 0 },
  });
};

/* --------------------------------- Virtuels --------------------------------- 
ParfumSchema.virtual("nombreNotes").get(function () {
  const a = Array.isArray(this.notes_tete) ? this.notes_tete.length : 0;
  const b = Array.isArray(this.notes_coeur) ? this.notes_coeur.length : 0;
  const c = Array.isArray(this.notes_fond) ? this.notes_fond.length : 0;
  return a + b + c;
});*/

// backend/models/Parfum.js - AJOUTER CE VIRTUAL

/* --------------------------------- Virtuels --------------------------------- */
ParfumSchema.virtual("notes").get(function () {
  // Retourner toutes les notes combinées pour compatibilité
  return [
    ...(this.notes_tete || []),
    ...(this.notes_coeur || []),
    ...(this.notes_fond || []),
  ];
});

ParfumSchema.virtual("aDesLiensMarchands").get(function () {
  return (this.nombreLiensMarchands || 0) > 0;
});

ParfumSchema.virtual("prixFormatte").get(function () {
  return typeof this.prix === "number" ? `${this.prix.toFixed(2)} EUR` : null;
});

ParfumSchema.set("toJSON", { virtuals: true });
ParfumSchema.set("toObject", { virtuals: true });

const Parfum = mongoose.model("Parfum", ParfumSchema);
export default Parfum;
