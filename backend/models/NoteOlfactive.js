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
    couleur: {
      type: String,
      default: "#gray",
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

// Index pour la recherche
noteOlfactiveSchema.index({ nom: "text", description: "text" });
noteOlfactiveSchema.index({ type: 1 });
noteOlfactiveSchema.index({ famille: 1 });
noteOlfactiveSchema.index({ popularite: -1 });

// Index composé pour les requêtes fréquentes
noteOlfactiveSchema.index({ type: 1, popularite: -1 });

// Méthode pour incrémenter la popularité
noteOlfactiveSchema.methods.incrementPopularite = function () {
  this.popularite += 1;
  return this.save();
};

// Méthode pour obtenir la couleur selon le type
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

// Méthode statique pour obtenir les notes par famille
noteOlfactiveSchema.statics.getByFamille = function (famille) {
  return this.find({ famille }).sort({ popularite: -1 });
};

// Méthode statique pour obtenir les notes les plus populaires
noteOlfactiveSchema.statics.getPopulaires = function (limit = 10) {
  return this.find().sort({ popularite: -1 }).limit(limit);
};

// Méthode statique pour la recherche avancée
noteOlfactiveSchema.statics.searchAdvanced = function (query) {
  const searchQuery = {};

  if (query.nom) {
    searchQuery.$or = [
      { nom: { $regex: query.nom, $options: "i" } },
      { synonymes: { $regex: query.nom, $options: "i" } },
    ];
  }

  if (query.type) {
    searchQuery.type = query.type;
  }

  if (query.famille) {
    searchQuery.famille = query.famille;
  }

  if (query.intensite) {
    searchQuery.intensite = {
      $gte: query.intensite.min,
      $lte: query.intensite.max,
    };
  }

  return this.find(searchQuery).sort({ popularite: -1 });
};

// Middleware pour nettoyer les références avant suppression
noteOlfactiveSchema.pre("deleteOne", async function () {
  const Parfum = mongoose.model("Parfum");
  const User = mongoose.model("User");

  // Retirer la note de tous les parfums
  await Parfum.updateMany({ notes: this._id }, { $pull: { notes: this._id } });

  // Retirer la note des favoris des utilisateurs
  await User.updateMany(
    { favorisNotes: this._id },
    { $pull: { favorisNotes: this._id } }
  );

  // Retirer la note des accords harmonieux
  await this.model("NoteOlfactive").updateMany(
    { accordsHarmonieux: this._id },
    { $pull: { accordsHarmonieux: this._id } }
  );
});

// Virtuel pour obtenir le nombre de parfums utilisant cette note
noteOlfactiveSchema.virtual("nombreParfums", {
  ref: "Parfum",
  localField: "_id",
  foreignField: "notes",
  count: true,
});

// Virtuel pour le nom complet avec type
noteOlfactiveSchema.virtual("nomComplet").get(function () {
  return `${this.nom} (${this.type})`;
});

// Configuration pour inclure les virtuels dans JSON
noteOlfactiveSchema.set("toJSON", { virtuals: true });
noteOlfactiveSchema.set("toObject", { virtuals: true });

const NoteOlfactive = mongoose.model("NoteOlfactive", noteOlfactiveSchema);

export default NoteOlfactive;
