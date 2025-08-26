import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Parfum from "../models/Parfum.js";
import NoteOlfactive from "../models/NoteOlfactive.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connecté pour le seeding");
  } catch (error) {
    console.error("Erreur connexion:", error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Nettoyer les données existantes
    await User.deleteMany({});
    await Parfum.deleteMany({});
    await NoteOlfactive.deleteMany({});

    // Créer des notes olfactives
    const notes = await NoteOlfactive.insertMany([
      { nom: "Rose", type: "cœur", famille: "florale" },
      { nom: "Vanille", type: "fond", famille: "gourmande" },
      { nom: "Bergamote", type: "tête", famille: "citrus" },
      { nom: "Santal", type: "fond", famille: "boisée" },
      { nom: "Jasmin", type: "cœur", famille: "florale" },
      { nom: "Patchouli", type: "fond", famille: "boisée" },
      { nom: "Citron", type: "tête", famille: "citrus" },
      { nom: "Iris", type: "cœur", famille: "florale" },
    ]);

    // Créer des parfums de test
    const parfums = await Parfum.insertMany([
      {
        nom: "La Vie Est Belle",
        marque: "Lancôme",
        genre: "femme",
        description: "Une fragrance joyeuse et gourmande",
        notes: [notes[0]._id, notes[1]._id, notes[7]._id],
        popularite: 85,
      },
      {
        nom: "Sauvage",
        marque: "Dior",
        genre: "homme",
        description: "Fresh et masculin",
        notes: [notes[2]._id, notes[5]._id],
        popularite: 92,
      },
      {
        nom: "Black Orchid",
        marque: "Tom Ford",
        genre: "mixte",
        description: "Mystérieux et sophistiqué",
        notes: [notes[5]._id, notes[1]._id],
        popularite: 78,
      },
    ]);

    // Créer un utilisateur admin
    const adminUser = await User.create({
      username: "admin",
      email: "admin@scentify.app",
      password: "admin123",
      isAdmin: true,
      isVerified: true,
    });

    console.log("✅ Données de test créées avec succès!");
    console.log(`📦 ${notes.length} notes olfactives`);
    console.log(`🌸 ${parfums.length} parfums`);
    console.log(
      `👤 1 utilisateur admin (email: admin@scentify.app, mdp: admin123)`
    );
  } catch (error) {
    console.error("Erreur lors du seeding:", error);
  } finally {
    mongoose.disconnect();
  }
};

connectDB().then(seedData);
