import NoteOlfactive from "../models/NoteOlfactive.js";
import Parfum from "../models/Parfum.js";
import mongoose from "mongoose";

// Obtenir toutes les notes olfactives
export const getNotes = async (req, res) => {
  try {
    const { type, search, page = 1, limit = 50 } = req.query;

    const query = {};

    if (type && type !== "tous") {
      query.type = type;
    }

    if (search) {
      query.nom = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const notes = await NoteOlfactive.find(query)
      .sort({ nom: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await NoteOlfactive.countDocuments(query);

    res.json({
      notes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Obtenir une note par ID
export const getNoteById = async (req, res) => {
  try {
    const note = await NoteOlfactive.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note olfactive non trouvée" });
    }

    // Obtenir les parfums associés
    // Chercher dans les 3 champs de notes
    const parfums = await Parfum.find({
      $or: [
        { notes_tete: note._id },
        { notes_coeur: note._id },
        { notes_fond: note._id },
      ],
    })
      .select("nom marque genre photo popularite")
      .sort({ popularite: -1 })
      .limit(10);

    res.json({
      note,
      parfums,
      nombreParfums: parfums.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Obtenir les notes par type
// AJOUTER cette fonction
export const getNotesByType = async (req, res) => {
  try {
    const { type } = req.params;

    // Valider le type
    const validTypes = ["tête", "cœur", "fond"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: "Type invalide. Types acceptés : tête, cœur, fond",
      });
    }

    const notes = await NoteOlfactive.find({ type })
      .sort({ nom: 1 })
      .limit(100);

    console.log(`✅ ${notes.length} notes trouvées pour le type "${type}"`);

    res.json(notes);
  } catch (error) {
    console.error("❌ Erreur getNotesByType:", error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Rechercher des notes olfactives
// backend/controllers/noteController.js - AMÉLIORATION
export const searchNotes = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Terme de recherche requis" });
    }

    // ✅ Recherche plus flexible
    const notes = await NoteOlfactive.find({
      $or: [
        { nom: { $regex: q, $options: "i" } },
        { synonymes: { $regex: q, $options: "i" } }, // Si vous avez des synonymes
      ],
    })
      .sort({ nom: 1 })
      .limit(20);

    console.log(`🔍 Recherche notes "${q}": ${notes.length} résultats`);

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Créer une nouvelle note olfactive (admin)
// backend/controllers/noteController.js - CORRIGER createNote

// Remplacer la fonction createNote existante par :
export const createNote = async (req, res) => {
  try {
    const { nom, description, type, famille } = req.body;

    // ✅ CORRIGER : Vérifier si la note existe déjà (avec le bon champ)
    const noteExistante = await NoteOlfactive.findOne({
      nom: nom.trim(),
      type: type,
    });

    if (noteExistante) {
      return res
        .status(400)
        .json({ message: "Cette note olfactive existe déjà" });
    }

    const note = new NoteOlfactive({
      nom: nom.trim(),
      description: description?.trim() || "",
      type,
      famille: famille?.trim() || "",
    });

    await note.save();

    res.status(201).json(note);
  } catch (error) {
    console.error("❌ Erreur createNote:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Mettre à jour une note olfactive (admin)
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const note = await NoteOlfactive.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!note) {
      return res.status(404).json({ message: "Note olfactive non trouvée" });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Supprimer une note olfactive (admin)
// Dans la fonction deleteNote, corriger la recherche des parfums utilisant une note :

export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ CORRIGER : Vérifier si la note est utilisée dans les 3 champs
    const parfumsUtilisant = await Parfum.countDocuments({
      $or: [{ notes_tete: id }, { notes_coeur: id }, { notes_fond: id }],
    });

    if (parfumsUtilisant > 0) {
      return res.status(400).json({
        message: `Cette note est utilisée par ${parfumsUtilisant} parfum(s). Suppression impossible.`,
      });
    }

    const note = await NoteOlfactive.findByIdAndDelete(id);

    if (!note) {
      return res.status(404).json({ message: "Note olfactive non trouvée" });
    }

    res.json({ message: "Note olfactive supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
// Obtenir les statistiques des notes
export const getNotesStats = async (req, res) => {
  try {
    const stats = await NoteOlfactive.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const total = await NoteOlfactive.countDocuments();

    res.json({
      total,
      parType: stats,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
