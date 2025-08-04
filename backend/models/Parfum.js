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
    liensMarchands: [
      {
        nom: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        prix: {
          type: Number,
          min: 0,
        },
      },
    ],
    codeBarres: {
      type: String,
      unique: true,
      sparse: true,
    },
    prix: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour les recherches
ParfumSchema.index({ nom: "text", marque: "text", description: "text" });
ParfumSchema.index({ genre: 1 });
ParfumSchema.index({ marque: 1 });
ParfumSchema.index({ popularite: -1 });
ParfumSchema.index({ notes: 1 });

// Méthode pour incrémenter la popularité
ParfumSchema.methods.incrementPopularite = function () {
  this.popularite += 1;
  return this.save();
};

// Virtuel pour le nombre de notes
ParfumSchema.virtual("nombreNotes").get(function () {
  return this.notes.length;
});

ParfumSchema.set("toJSON", { virtuals: true });

const Parfum = mongoose.model("Parfum", ParfumSchema);
export default Parfum;
// Export du modèle