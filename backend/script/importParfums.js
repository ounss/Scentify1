import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import Parfum from "../models/Parfum.js";
import NoteOlfactive from "../models/NoteOlfactive.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connecté pour l'import");
  } catch (error) {
    console.error("Erreur connexion:", error);
    process.exit(1);
  }
};

const importParfums = async () => {
  try {
    // Lire le fichier JSON
    const parfumsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/test.parfums.json"), "utf8")
    );

    console.log(`📦 ${parfumsData.length} parfums à importer...`);

    // Nettoyer les collections existantes
    await Parfum.deleteMany({});
    await NoteOlfactive.deleteMany({});
    console.log("Collections vidées");

    // Créer un map des notes uniques
    const notesMap = new Map();

    // Extraire toutes les notes uniques
    parfumsData.forEach((parfum) => {
      ["notes_tete", "notes_coeur", "notes_fond"].forEach((type, index) => {
        const noteType = ["tête", "cœur", "fond"][index];

        if (parfum[type] && Array.isArray(parfum[type])) {
          parfum[type].forEach((noteName) => {
            if (!notesMap.has(noteName)) {
              notesMap.set(noteName, {
                nom: noteName,
                type: noteType,
                description: `Note ${noteType} - ${noteName}`,
                famille: getNoteFamille(noteName),
              });
            }
          });
        }
      });
    });

    // Insérer les notes
    const notesToInsert = Array.from(notesMap.values());
    const insertedNotes = await NoteOlfactive.insertMany(notesToInsert);

    // Créer un index nom -> _id pour les notes
    const noteNameToId = {};
    insertedNotes.forEach((note) => {
      noteNameToId[note.nom] = note._id;
    });

    console.log(`✅ ${insertedNotes.length} notes importées`);

    // Transformer les parfums
    const parfumsToInsert = parfumsData.map((parfum) => {
      const notes = [];

      // Collecter toutes les notes avec leurs IDs
      ["notes_tete", "notes_coeur", "notes_fond"].forEach((type) => {
        if (parfum[type] && Array.isArray(parfum[type])) {
          parfum[type].forEach((noteName) => {
            if (noteNameToId[noteName]) {
              notes.push(noteNameToId[noteName]);
            }
          });
        }
      });

      return {
        nom: parfum.nom,
        marque: getMarqueFromName(parfum.nom),
        genre:
          parfum.type === "homme"
            ? "homme"
            : parfum.type === "femme"
            ? "femme"
            : "mixte",
        notes: notes,
        photo: parfum.photo_url || null,
        popularite: Math.floor(Math.random() * 100), // Générer une popularité aléatoire
        liensMarchands: parfum.buy_links
          ? parfum.buy_links.map((link) => ({
              nom: link.label,
              url: link.url,
              prix: Math.floor(Math.random() * 200) + 50, // Prix aléatoire entre 50-250€
            }))
          : [],
      };
    });

    // Insérer les parfums
    const insertedParfums = await Parfum.insertMany(parfumsToInsert);
    console.log(`✅ ${insertedParfums.length} parfums importés`);

    console.log("\n🎉 Import terminé avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors de l'import:", error);
  } finally {
    mongoose.disconnect();
  }
};

// Fonction helper pour déterminer la famille d'une note
function getNoteFamille(noteName) {
  const familles = {
    citrus: ["bergamote", "citron", "pamplemousse", "orange", "mandarine"],
    florale: [
      "rose",
      "jasmin",
      "pivoine",
      "freesia",
      "iris",
      "orchidée",
      "mimosa",
      "ylang-ylang",
    ],
    boisée: [
      "cèdre",
      "santal",
      "vétiver",
      "bois de gaïac",
      "mousse de chêne",
      "papyrus",
      "bois de cachemire",
    ],
    orientale: ["vanille", "ambre", "musc", "encens"],
    épicée: ["cardamome", "poivre", "cannelle", "gingembre", "muscade"],
    fruitée: ["poire", "pêche", "ananas", "cassis"],
    gourmande: ["café", "pralinÉ", "chocolat", "miel"],
    verte: ["lavande", "menthe", "sauge", "thé"],
    marine: ["algues", "sel marin"],
  };

  const lowerNoteName = noteName.toLowerCase();

  for (const [famille, notes] of Object.entries(familles)) {
    if (notes.some((note) => lowerNoteName.includes(note.toLowerCase()))) {
      return famille;
    }
  }

  return "autre";
}

// Fonction helper pour extraire la marque du nom du parfum
function getMarqueFromName(nom) {
  const marques = [
    "Dior",
    "Chanel",
    "Tom Ford",
    "Creed",
    "Le Labo",
    "Maison Francis Kurkdjian",
    "Yves Saint Laurent",
    "Hermès",
    "Paco Rabanne",
    "Hugo Boss",
    "Lancôme",
    "Givenchy",
    "Narciso Rodriguez",
    "Acqua di Parma",
    "Gucci",
    "Viktor&Rolf",
  ];

  for (const marque of marques) {
    if (nom.toLowerCase().includes(marque.toLowerCase())) {
      return marque;
    }
  }

  // Par défaut, prendre le premier mot comme marque
  const mots = nom.split(" ");
  return mots.length > 1 ? mots[0] : "Autre";
}

// Lancer l'import
connectDB().then(importParfums);
