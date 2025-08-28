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

    // ✅ CORRECTION URGENTE - Initialisation des tableaux
    favorisParfums: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Parfum",
        },
      ],
      default: [], // ✅ AJOUTÉ - Très important !
    },
    favorisNotes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "NoteOlfactive",
        },
      ],
      default: [], // ✅ AJOUTÉ - Très important !
    },
    historique: {
      type: [
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
      default: [], // ✅ AJOUTÉ - Très important !
    },

    preferences: {
      genrePreference: {
        type: String,
        enum: ["homme", "femme", "mixte"],
        default: "mixte",
      },
      famillesPreferees: {
        type: [String],
        default: [], // ✅ AJOUTÉ
      },
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

// ✅ MÉTHODES POUR FAVORIS PARFUMS - CORRIGÉES
UserSchema.methods.addFavoriParfum = async function (parfumId) {
  // Initialiser le tableau s'il n'existe pas
  if (!this.favorisParfums) {
    this.favorisParfums = [];
  }

  if (!this.favorisParfums.includes(parfumId)) {
    this.favorisParfums.push(parfumId);
    await this.save();
    console.log(`✅ Parfum ${parfumId} ajouté aux favoris de ${this.username}`);
  } else {
    console.log(`⚠️ Parfum ${parfumId} déjà en favoris pour ${this.username}`);
  }
  return this;
};

UserSchema.methods.removeFavoriParfum = async function (parfumId) {
  // Initialiser le tableau s'il n'existe pas
  if (!this.favorisParfums) {
    this.favorisParfums = [];
  }

  this.favorisParfums = this.favorisParfums.filter(
    (id) => !id.equals(parfumId)
  );
  await this.save();
  console.log(`✅ Parfum ${parfumId} retiré des favoris de ${this.username}`);
  return this;
};

// ✅ MÉTHODES POUR FAVORIS NOTES - CORRIGÉES
UserSchema.methods.addFavoriNote = async function (noteId) {
  // Initialiser le tableau s'il n'existe pas
  if (!this.favorisNotes) {
    this.favorisNotes = [];
  }

  if (!this.favorisNotes.includes(noteId)) {
    this.favorisNotes.push(noteId);
    await this.save();
    console.log(`✅ Note ${noteId} ajoutée aux favoris de ${this.username}`);
  }
  return this;
};

UserSchema.methods.removeFavoriNote = async function (noteId) {
  // Initialiser le tableau s'il n'existe pas
  if (!this.favorisNotes) {
    this.favorisNotes = [];
  }

  this.favorisNotes = this.favorisNotes.filter((id) => !id.equals(noteId));
  await this.save();
  console.log(`✅ Note ${noteId} retirée des favoris de ${this.username}`);
  return this;
};

// ✅ MÉTHODE POUR HISTORIQUE - CORRIGÉE
UserSchema.methods.addToHistorique = async function (parfumId) {
  // Initialiser le tableau s'il n'existe pas
  if (!this.historique) {
    this.historique = [];
  }

  // Supprimer l'entrée existante si elle existe
  this.historique = this.historique.filter((h) => !h.parfum.equals(parfumId));

  // Ajouter au début
  this.historique.unshift({
    parfum: parfumId,
    dateVisite: new Date(),
  });

  // Limiter à 50 entrées
  if (this.historique.length > 50) {
    this.historique = this.historique.slice(0, 50);
  }

  await this.save();
  console.log(
    `✅ Parfum ${parfumId} ajouté à l'historique de ${this.username}`
  );
  return this;
};

UserSchema.methods.clearHistorique = async function () {
  this.historique = [];
  await this.save();
  console.log(`✅ Historique vidé pour ${this.username}`);
  return this;
};

// ✅ VIRTUALS CORRIGÉS
UserSchema.virtual("favoriCount").get(function () {
  const parfumsCount = this.favorisParfums ? this.favorisParfums.length : 0;
  const notesCount = this.favorisNotes ? this.favorisNotes.length : 0;
  return parfumsCount + notesCount;
});

UserSchema.virtual("historiqueCount").get(function () {
  return this.historique ? this.historique.length : 0;
});

UserSchema.set("toJSON", { virtuals: true });

const User = mongoose.model("User", UserSchema);
export default User;
