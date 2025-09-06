// scripts/migrateNotes.js - Script de migration
import mongoose from "mongoose";
import NoteOlfactive from "../models/NoteOlfactive.js";
import Parfum from "../models/Parfum.js";

// ✅ Palette des couleurs par familles (ajout)
const COULEURS_FAMILLES = {
  agrumes: "#f59e0b",
  florale: "#ec4899",
  fruitée: "#ef4444",
  verte: "#10b981",
  aromatique: "#8b5cf6",
  épicée: "#dc2626",
  boisée: "#92400e",
  orientale: "#7c2d12",
  ambrée: "#d97706",
  musquée: "#6b7280",
  animale: "#374151",
  poudrée: "#f472b6",
  gourmande: "#a855f7",
  marine: "#06b6d4",
  aldéhydée: "#e5e7eb",
  cuirée: "#451a03",
  fumée: "#6b7280",
  résineuse: "#365314",
};

async function migrateNotes() {
  try {
    console.log("🔄 Début de la migration des notes...");

    // 1. Récupérer toutes les notes existantes
    const existingNotes = await NoteOlfactive.find({});
    console.log(`📝 ${existingNotes.length} notes trouvées`);

    // 2. Analyser l'usage de chaque note dans les parfums
    const parfums = await Parfum.find({}).populate(
      "notes_tete notes_coeur notes_fond"
    );
    console.log(`🌺 ${parfums.length} parfums trouvés`);

    // 3. Calculer les statistiques d'usage
    const noteStats = new Map();

    parfums.forEach((parfum) => {
      // Analyser notes de tête
      (parfum.notes_tete || []).forEach((note) => {
        const id = note._id.toString();
        if (!noteStats.has(id)) {
          noteStats.set(id, {
            note: note,
            tete: 0,
            coeur: 0,
            fond: 0,
            parfums: new Set(),
          });
        }
        noteStats.get(id).tete++;
        noteStats.get(id).parfums.add(parfum._id);
      });

      // Analyser notes de cœur
      (parfum.notes_coeur || []).forEach((note) => {
        const id = note._id.toString();
        if (!noteStats.has(id)) {
          noteStats.set(id, {
            note: note,
            tete: 0,
            coeur: 0,
            fond: 0,
            parfums: new Set(),
          });
        }
        noteStats.get(id).coeur++;
        noteStats.get(id).parfums.add(parfum._id);
      });

      // Analyser notes de fond
      (parfum.notes_fond || []).forEach((note) => {
        const id = note._id.toString();
        if (!noteStats.has(id)) {
          noteStats.set(id, {
            note: note,
            tete: 0,
            coeur: 0,
            fond: 0,
            parfums: new Set(),
          });
        }
        noteStats.get(id).fond++;
        noteStats.get(id).parfums.add(parfum._id);
      });
    });

    console.log(`📊 Statistiques calculées pour ${noteStats.size} notes`);

    // 4. Mettre à jour chaque note avec ses nouvelles données
    for (const [noteId, stats] of noteStats) {
      const note = await NoteOlfactive.findById(noteId);
      if (!note) continue;

      // Déterminer les positions suggérées
      const suggestedPositions = [];
      if (stats.tete >= 3) suggestedPositions.push("tête");
      if (stats.coeur >= 3) suggestedPositions.push("cœur");
      if (stats.fond >= 3) suggestedPositions.push("fond");

      // Si aucune position n'est fréquente, garder l'ancien type
      if (suggestedPositions.length === 0 && note.type) {
        suggestedPositions.push(note.type);
      }

      // ✅ Mise à jour (ajout du champ couleur)
      await NoteOlfactive.findByIdAndUpdate(noteId, {
        $set: {
          usages: {
            tete: {
              frequence: stats.tete,
              populaire: stats.tete >= 10,
            },
            coeur: {
              frequence: stats.coeur,
              populaire: stats.coeur >= 10,
            },
            fond: {
              frequence: stats.fond,
              populaire: stats.fond >= 10,
            },
          },
          suggestedPositions,
          "stats.nombreParfums": stats.parfums.size,
          "stats.derniereUtilisation": new Date(),
          // ✅ AJOUT : Couleur par famille
          couleur: COULEURS_FAMILLES[note.famille] || "#4a90e2",
        },
        $unset: {
          type: "", // Supprimer l'ancien champ type
        },
      });

      console.log(
        `✅ Note "${note.nom}" migrée - Tête:${stats.tete}, Cœur:${stats.coeur}, Fond:${stats.fond}`
      );
    }

    // 5. Traiter les notes qui ne sont dans aucun parfum
    const unusedNotes = await NoteOlfactive.find({
      _id: { $nin: Array.from(noteStats.keys()) },
    });

    for (const note of unusedNotes) {
      const suggestedPositions = note.type ? [note.type] : ["cœur"]; // Par défaut cœur

      // ✅ Mise à jour (ajout du champ couleur)
      await NoteOlfactive.findByIdAndUpdate(note._id, {
        $set: {
          usages: {
            tete: { frequence: 0, populaire: false },
            coeur: { frequence: 0, populaire: false },
            fond: { frequence: 0, populaire: false },
          },
          suggestedPositions,
          "stats.nombreParfums": 0,
          // ✅ AJOUT : Couleur par famille
          couleur: COULEURS_FAMILLES[note.famille] || "#4a90e2",
        },
        $unset: {
          type: "",
        },
      });

      console.log(
        `⚠️ Note inutilisée "${note.nom}" migrée avec position par défaut`
      );
    }

    console.log("✅ Migration terminée avec succès !");

    // 6. Statistiques finales
    const migratedNotes = await NoteOlfactive.find({});
    console.log(`📈 Résumé de la migration :`);
    console.log(`   - ${migratedNotes.length} notes migrées`);
    console.log(
      `   - ${
        migratedNotes.filter((n) => n.usages.tete.populaire).length
      } notes populaires en tête`
    );
    console.log(
      `   - ${
        migratedNotes.filter((n) => n.usages.coeur.populaire).length
      } notes populaires en cœur`
    );
    console.log(
      `   - ${
        migratedNotes.filter((n) => n.usages.fond.populaire).length
      } notes populaires en fond`
    );
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    process.exit(1);
  }
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  // Connexion à MongoDB
  mongoose
    .connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://ounsbnhl:if6qHUODl7DFalNo@scentify.ggems57.mongodb.net/"
    )
    .then(() => {
      console.log("🔗 Connecté à MongoDB");
      return migrateNotes();
    })
    .then(() => {
      console.log("🎉 Migration terminée, fermeture de la connexion");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Erreur:", error);
      process.exit(1);
    });
}

export default migrateNotes;
