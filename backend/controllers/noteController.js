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
export const getNotesByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!["tête", "cœur", "fond"].includes(type)) {
      return res.status(400).json({ message: "Type de note invalide" });
    }

    const notes = await NoteOlfactive.find({ type }).sort({ nom: 1 });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Rechercher des notes olfactives
export const searchNotes = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Terme de recherche requis" });
    }

    const notes = await NoteOlfactive.find({
      nom: { $regex: q, $options: "i" },
    })
      .sort({ nom: 1 })
      .limit(20);

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Créer une nouvelle note olfactive (admin)
export const createNote = async (req, res) => {
  try {
    const { nom, description, type } = req.body;

    // Vérifier si la note existe déjà
    const parfumsUtilisant = await Parfum.countDocuments({
      $or: [{ notes_tete: id }, { notes_coeur: id }, { notes_fond: id }],
    });
    if (noteExistante) {
      return res
        .status(400)
        .json({ message: "Cette note olfactive existe déjà" });
    }

    const note = new NoteOlfactive({
      nom,
      description,
      type,
    });

    await note.save();

    res.status(201).json(note);
  } catch (error) {
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
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la note est utilisée par des parfums
    const parfumsUtilisant = await Parfum.countDocuments({ notes: id });
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
