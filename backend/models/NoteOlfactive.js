// backend/models/NoteOlfactive.js
import mongoose from "mongoose";

const noteOlfactiveSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // Type d'évaporation de la note (tête / cœur / fond)
    type: {
      type: String,
      enum: ["tête", "cœur", "fond"],
      required: true,
    },
    famille: {
      type: String,
      enum: [
        "citrus",
        "florale",
        "orientale",
        "boisée",
        "fraîche",
        "gourmande",
        "épicée",
        "fruitée",
        "marine",
        "verte",
      ],
      default: null,
    },
    intensite: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    popularite: {
      type: Number,
      default: 0,
    },
    // ⚠️ "#gray" n'est pas un hex valide -> gris par défaut
    couleur: {
      type: String,
      default: "#6b7280",
    },
    image: {
      type: String,
      default: null,
    },
    synonymes: [
      {
        type: String,
        trim: true,
      },
    ],
    accordsHarmonieux: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NoteOlfactive",
      },
    ],
    saison: [
      {
        type: String,
        enum: ["printemps", "été", "automne", "hiver"],
      },
    ],
    momentJournee: [
      {
        type: String,
        enum: ["matin", "après-midi", "soir", "nuit"],
      },
    ],
  },
  {
    timestamps: true,
  }
);

/* ------------------------- Indexes & Recherche ------------------------- */
noteOlfactiveSchema.index({ nom: "text", description: "text" });
noteOlfactiveSchema.index({ type: 1 });
noteOlfactiveSchema.index({ famille: 1 });
noteOlfactiveSchema.index({ popularite: -1 });
noteOlfactiveSchema.index({ type: 1, popularite: -1 }); // composé

/* ------------------------------ Méthodes ------------------------------- */
noteOlfactiveSchema.methods.incrementPopularite = function () {
  this.popularite += 1;
  return this.save();
};

noteOlfactiveSchema.methods.getCouleurType = function () {
  switch (this.type) {
    case "tête":
      return "#fbbf24"; // jaune
    case "cœur":
      return "#f472b6"; // rose
    case "fond":
      return "#8b5cf6"; // violet
    default:
      return "#6b7280"; // gris
  }
};

noteOlfactiveSchema.statics.getByFamille = function (famille) {
  return this.find({ famille }).sort({ popularite: -1 });
};

noteOlfactiveSchema.statics.getPopulaires = function (limit = 10) {
  return this.find().sort({ popularite: -1 }).limit(limit);
};

noteOlfactiveSchema.statics.searchAdvanced = function (query) {
  const searchQuery = {};

  if (query.nom) {
    searchQuery.$or = [
      { nom: { $regex: query.nom, $options: "i" } },
      { synonymes: { $regex: query.nom, $options: "i" } },
    ];
  }

  if (query.type) searchQuery.type = query.type;
  if (query.famille) searchQuery.famille = query.famille;

  if (query.intensite) {
    const min = Number(query.intensite.min ?? 1);
    const max = Number(query.intensite.max ?? 10);
    searchQuery.intensite = { $gte: min, $lte: max };
  }

  return this.find(searchQuery).sort({ popularite: -1 });
};

/* --------- Nettoyage des références avant suppression (safe) ---------- */
// On a besoin du document pour accéder à this._id → { document: true }
noteOlfactiveSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function () {
    const Parfum = mongoose.model("Parfum");
    const User = mongoose.model("User");

    // Retirer la note des 3 champs de Parfum (tête / cœur / fond)
    await Parfum.updateMany(
      {
        $or: [
          { notes_tete: this._id },
          { notes_coeur: this._id },
          { notes_fond: this._id },
        ],
      },
      {
        $pull: {
          notes_tete: this._id,
          notes_coeur: this._id,
          notes_fond: this._id,
        },
      }
    );

    // Retirer la note des favoris utilisateurs
    await User.updateMany(
      { favorisNotes: this._id },
      { $pull: { favorisNotes: this._id } }
    );

    // Retirer la note des accords harmonieux
    await this.model("NoteOlfactive").updateMany(
      { accordsHarmonieux: this._id },
      { $pull: { accordsHarmonieux: this._id } }
    );
  }
);

/* ------------------------------- Virtuels ------------------------------ */
// Comptages séparés (les 3 chemins de Parfum)
noteOlfactiveSchema.virtual("nombreParfumsTete", {
  ref: "Parfum",
  localField: "_id",
  foreignField: "notes_tete",
  count: true,
});
noteOlfactiveSchema.virtual("nombreParfumsCoeur", {
  ref: "Parfum",
  localField: "_id",
  foreignField: "notes_coeur",
  count: true,
});
noteOlfactiveSchema.virtual("nombreParfumsFond", {
  ref: "Parfum",
  localField: "_id",
  foreignField: "notes_fond",
  count: true,
});

// Nom complet (ex: "Jasmin (cœur)")
noteOlfactiveSchema.virtual("nomComplet").get(function () {
  return `${this.nom} (${this.type})`;
});

// Inclure les virtuels au export
noteOlfactiveSchema.set("toJSON", { virtuals: true });
noteOlfactiveSchema.set("toObject", { virtuals: true });

const NoteOlfactive = mongoose.model("NoteOlfactive", noteOlfactiveSchema);
export default NoteOlfactive;
