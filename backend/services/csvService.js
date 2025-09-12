import { Parser } from "json2csv";
import csv from "csv-parser";
import fs from "fs";
import Parfum from "../models/Parfum.js";
import NoteOlfactive from "../models/NoteOlfactive.js";

// Export utilisateurs en CSV
export const exportUsers = async (users) => {
  try {
    const fields = [
      "username",
      "email",
      "createdAt",
      "isAdmin",
      "favoriCount",
      "historiqueCount",
    ];

    const opts = { fields };
    const parser = new Parser(opts);

    const userData = users.map((user) => ({
      username: user.username,
      email: user.email,
      createdAt: user.createdAt.toISOString().split("T")[0],
      isAdmin: user.isAdmin ? "Oui" : "Non",
      favoriCount: user.favorisParfums.length + user.favorisNotes.length,
      historiqueCount: user.historique.length,
    }));

    return parser.parse(userData);
  } catch (error) {
    throw new Error("Erreur lors de l'export CSV: " + error.message);
  }
};

// Export parfums en CSV
export const exportParfums = async (parfums) => {
  try {
    const fields = [
      "nom",
      "marque",
      "genre",
      "description",
      "notes",
      "popularite",
      "prix",
      "createdAt",
    ];

    const opts = { fields };
    const parser = new Parser(opts);

    const parfumData = parfums.map((parfum) => ({
      nom: parfum.nom,
      marque: parfum.marque,
      genre: parfum.genre,
      description: parfum.description,
      notes: parfum.notes.map((note) => note.nom).join(", "),
      popularite: parfum.popularite,
      prix: parfum.prix || "",
      createdAt: parfum.createdAt.toISOString().split("T")[0],
    }));

    return parser.parse(parfumData);
  } catch (error) {
    throw new Error("Erreur lors de l'export CSV: " + error.message);
  }
};

// Import notes olfactives depuis CSV
export const importNotes = async (filePath) => {
  return new Promise((resolve, reject) => {
    const notes = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        // Format CSV attendu: nom,description,type,famille,intensite
        if (row.nom && row.type) {
          notes.push({
            nom: row.nom.trim(),
            description: row.description?.trim() || "",
            type: row.type.trim(),
            famille: row.famille?.trim() || null,
            intensite: parseInt(row.intensite) || 5,
          });
        }
      })
      .on("end", async () => {
        try {
          // Import en masse avec gestion des doublons
          const results = await Promise.allSettled(
            notes.map((note) =>
              NoteOlfactive.findOneAndUpdate({ nom: note.nom }, note, {
                upsert: true,
                new: true,
              })
            )
          );

          const imported = results.filter(
            (r) => r.status === "fulfilled"
          ).length;
          const errors = results.filter((r) => r.status === "rejected").length;

          resolve({ imported, errors, total: notes.length });
        } catch (error) {
          reject(error);
        }
      })
      .on("error", reject);
  });
};

// Import parfums depuis CSV
export const importParfums = async (filePath) => {
  return new Promise((resolve, reject) => {
    const parfums = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        // Format CSV attendu: nom,marque,genre,description,notes,prix
        if (row.nom && row.marque && row.genre) {
          parfums.push({
            nom: row.nom.trim(),
            marque: row.marque.trim(),
            genre: row.genre.trim(),
            description: row.description?.trim() || "",
            notesNames: row.notes
              ? row.notes.split(",").map((n) => n.trim())
              : [],
            prix: row.prix ? parseFloat(row.prix) : null,
          });
        }
      })
      .on("end", async () => {
        try {
          const results = [];

          for (const parfumData of parfums) {
            try {
              // Trouver les IDs des notes
              const notes = await NoteOlfactive.find({
                nom: { $in: parfumData.notesNames },
              });

              const parfum = {
                nom: parfumData.nom,
                marque: parfumData.marque,
                genre: parfumData.genre,
                description: parfumData.description,
                notes: notes.map((note) => note._id),
                prix: parfumData.prix,
              };

              const result = await Parfum.findOneAndUpdate(
                { nom: parfum.nom, marque: parfum.marque },
                parfum,
                { upsert: true, new: true }
              );

              results.push({ status: "fulfilled", value: result });
            } catch (error) {
              results.push({ status: "rejected", reason: error });
            }
          }

          const imported = results.filter(
            (r) => r.status === "fulfilled"
          ).length;
          const errors = results.filter((r) => r.status === "rejected").length;

          resolve({ imported, errors, total: parfums.length });
        } catch (error) {
          reject(error);
        }
      })
      .on("error", reject);
  });
};

export default {
  exportUsers,
  exportParfums,
  importNotes,
  importParfums,
};
