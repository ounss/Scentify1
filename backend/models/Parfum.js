// backend/models/Parfum.js - CORRECTION LIENS MARCHANDS
import mongoose from "mongoose";

const ParfumSchema = new mongoose.Schema(
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
    notes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NoteOlfactive",
      },
    ],
    photo: {
      type: String,
      default: null,
    },
    popularite: {
      type: Number,
      default: 0,
    },

    // ✅ LIENS MARCHANDS AMÉLIORÉS - STRUCTURE COMPLÈTE
    liensMarchands: [
      {
        nom: {
          type: String,
          required: true,
          enum: [
            "Sephora",
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
              // Validation URL plus stricte
              const urlPattern =
                /^https?:\/\/([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?(\?[;&a-z\d%_\.~+=-]*)?(\#[-a-z\d_]*)?$/i;
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
              // Accepter null/undefined ou nombre positif avec max 2 décimales
              return (
                v === null ||
                v === undefined ||
                (typeof v === "number" &&
                  v >= 0 &&
                  Number.isFinite(v) &&
                  (v * 100) % 1 === 0)
              ); // Max 2 décimales
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
            validator: function (v) {
              if (!v) return true; // Optionnel
              // Format: nombre + ml/L (ex: 50ml, 100ml, 1L)
              return /^\d+(\.\d+)?(ml|L)$/i.test(v);
            },
            message: "Format de taille invalide (ex: 50ml, 100ml, 1L)",
          },
        },
        disponible: {
          type: Boolean,
          default: true,
        },
        enPromotion: {
          type: Boolean,
          default: false,
        },
        prixOriginal: {
          type: Number,
          min: 0,
          validate: {
            validator: function (v) {
              // Si enPromotion = true, prixOriginal doit être > prix
              if (this.enPromotion && v && this.prix) {
                return v > this.prix;
              }
              return true;
            },
            message:
              "Le prix original doit être supérieur au prix promotionnel",
          },
        },
        dateVerification: {
          type: Date,
          default: Date.now,
        },
        // ✅ Informations de livraison
        fraisLivraison: {
          type: Number,
          min: 0,
          default: null, // null = gratuit ou non spécifié
        },
        delaiLivraison: {
          type: String, // ex: "2-3 jours", "24h", "1 semaine"
          maxlength: 50,
        },
        // ✅ Notes et commentaires
        noteQualite: {
          type: Number,
          min: 1,
          max: 5,
          validate: {
            validator: Number.isInteger,
            message: "La note doit être un nombre entier entre 1 et 5",
          },
        },
        commentaire: {
          type: String,
          maxlength: 200,
          trim: true,
        },
      },
    ],

    codeBarres: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // Optionnel
          // Validation code-barres EAN-13 ou UPC-A
          return /^\d{12,13}$/.test(v);
        },
        message: "Code-barres invalide (12 ou 13 chiffres requis)",
      },
    },

    // ✅ PRIX PRINCIPAL DU PARFUM (prix moyen ou de référence)
    prix: {
      type: Number,
      min: 0,
      validate: {
        validator: function (v) {
          return (
            v === null ||
            v === undefined ||
            (typeof v === "number" && v >= 0 && (v * 100) % 1 === 0)
          );
        },
        message: "Prix invalide",
      },
    },

    // ✅ MÉTADONNÉES POUR LES LIENS MARCHANDS
    meilleurPrix: {
      type: Number,
      min: 0,
    },
    nombreLiensMarchands: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ INDEX OPTIMISÉS
ParfumSchema.index({ nom: "text", marque: "text", description: "text" });
ParfumSchema.index({ genre: 1 });
ParfumSchema.index({ marque: 1 });
ParfumSchema.index({ popularite: -1 });
ParfumSchema.index({ notes: 1 });
ParfumSchema.index({ "liensMarchands.prix": 1 }); // Index pour recherche par prix
ParfumSchema.index({ meilleurPrix: 1 }); // Index pour tri par prix

// ✅ MIDDLEWARE PRE-SAVE - CALCUL AUTOMATIQUE DU MEILLEUR PRIX
ParfumSchema.pre("save", function (next) {
  if (this.liensMarchands && this.liensMarchands.length > 0) {
    // Calculer le meilleur prix disponible
    const prixDisponibles = this.liensMarchands
      .filter((lien) => lien.disponible && lien.prix && lien.prix > 0)
      .map((lien) => lien.prix);

    if (prixDisponibles.length > 0) {
      this.meilleurPrix = Math.min(...prixDisponibles);
    } else {
      this.meilleurPrix = undefined;
    }

    // Mettre à jour le nombre de liens
    this.nombreLiensMarchands = this.liensMarchands.length;

    // Si pas de prix principal défini, utiliser le meilleur prix
    if (!this.prix && this.meilleurPrix) {
      this.prix = this.meilleurPrix;
    }
  }

  next();
});

// ✅ MÉTHODES UTILITAIRES
ParfumSchema.methods.incrementPopularite = function () {
  this.popularite += 1;
  return this.save();
};

// ✅ Méthode pour obtenir les liens valides
ParfumSchema.methods.getLiensValides = function () {
  return this.liensMarchands.filter(
    (lien) => lien.disponible && lien.url && !this.isLienExpire(lien)
  );
};

// ✅ Méthode pour vérifier si un lien est expiré (plus de 30 jours)
ParfumSchema.methods.isLienExpire = function (lien) {
  if (!lien.dateVerification) return false;

  const maintenant = new Date();
  const dateVerif = new Date(lien.dateVerification);
  const diffJours = (maintenant - dateVerif) / (1000 * 60 * 60 * 24);

  return diffJours > 30; // Considérer comme expiré après 30 jours
};

// ✅ Méthode pour obtenir le prix avec promotion
ParfumSchema.methods.getPrixAffiche = function (lien) {
  if (lien.enPromotion && lien.prixOriginal) {
    const reduction = (
      ((lien.prixOriginal - lien.prix) / lien.prixOriginal) *
      100
    ).toFixed(0);
    return {
      prix: lien.prix,
      prixOriginal: lien.prixOriginal,
      reduction: reduction,
      enPromotion: true,
    };
  }
  return {
    prix: lien.prix,
    enPromotion: false,
  };
};

// ✅ MÉTHODES STATIQUES
ParfumSchema.statics.findByPriceRange = function (minPrix, maxPrix) {
  return this.find({
    meilleurPrix: {
      $gte: minPrix || 0,
      $lte: maxPrix || Number.MAX_SAFE_INTEGER,
    },
  });
};

ParfumSchema.statics.findWithValidLinks = function () {
  return this.find({
    "liensMarchands.disponible": true,
    nombreLiensMarchands: { $gt: 0 },
  });
};

// ✅ VIRTUALS
ParfumSchema.virtual("nombreNotes").get(function () {
  return this.notes.length;
});

ParfumSchema.virtual("aDesLiensMarchands").get(function () {
  return this.nombreLiensMarchands > 0;
});

ParfumSchema.virtual("prixFormatte").get(function () {
  if (!this.prix) return null;
  return `${this.prix.toFixed(2)} EUR`;
});

ParfumSchema.set("toJSON", { virtuals: true });
ParfumSchema.set("toObject", { virtuals: true });

const Parfum = mongoose.model("Parfum", ParfumSchema);
export default Parfum;
