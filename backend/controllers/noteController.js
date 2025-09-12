// backend/controllers/noteController.js - VERSION REFACTORISÉE
import NoteOlfactive from "../models/NoteOlfactive.js";
import Parfum from "../models/Parfum.js";
import mongoose from "mongoose";

// ✅ Obtenir toutes les notes avec filtres avancés
export const getNotes = async (req, res) => {
  try {
    const {
      search,
      famille,
      position,
      populaire,
      page = 1,
      limit = 100,
      sort = "nom",
    } = req.query;

    // Construction de la requête (gardez votre logique existante)
    const query = {};

    if (search) {
      query.$or = [
        { nom: { $regex: search, $options: "i" } },
        { synonymes: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (famille && famille !== "tous") {
      query.famille = famille;
    }

    if (position && ["tête", "cœur", "fond"].includes(position)) {
      const key =
        position === "tête" ? "tete" : position === "cœur" ? "coeur" : "fond";
      query[`usages.${key}.frequence`] = { $gt: 0 }; // Au lieu de populaire seulement
    }

    if (populaire === "true") {
      query.popularite = { $gte: 50 };
    }

    // Tri
    const sortOptions = {};
    switch (sort) {
      case "popularite":
        sortOptions.popularite = -1;
        break;
      case "usage":
        sortOptions["stats.nombreParfums"] = -1;
        break;
      case "recent":
        sortOptions["stats.derniereUtilisation"] = -1;
        break;
      default:
        sortOptions.nom = 1;
    }

    const skip = (page - 1) * limit;

    const notes = await NoteOlfactive.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await NoteOlfactive.countDocuments(query);

    console.log(`✅ ${notes.length} notes trouvées sur ${total}`);

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
    console.error("❌ Erreur getNotes:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
export const recalculateAllStats = async (req, res) => {
  try {
    console.log("🔄 Actualisation forcée des statistiques des notes...");

    // Obtenir toutes les notes
    const notes = await NoteOlfactive.find({});
    let updatedCount = 0;

    for (const note of notes) {
      // Recalculer les statistiques pour chaque note
      const teteCount = await Parfum.countDocuments({ notes_tete: note._id });
      const coeurCount = await Parfum.countDocuments({ notes_coeur: note._id });
      const fondCount = await Parfum.countDocuments({ notes_fond: note._id });

      const totalUsage = teteCount + coeurCount + fondCount;

      // Positions suggérées
      const suggestedPositions = [];
      if (teteCount >= 3) suggestedPositions.push("tête");
      if (coeurCount >= 3) suggestedPositions.push("cœur");
      if (fondCount >= 3) suggestedPositions.push("fond");

      if (suggestedPositions.length === 0 && totalUsage > 0) {
        const maxUsage = Math.max(teteCount, coeurCount, fondCount);
        if (teteCount === maxUsage) suggestedPositions.push("tête");
        else if (coeurCount === maxUsage) suggestedPositions.push("cœur");
        else suggestedPositions.push("fond");
      }

      // Mettre à jour
      await NoteOlfactive.findByIdAndUpdate(note._id, {
        usages: {
          tete: { frequence: teteCount, populaire: teteCount >= 10 },
          coeur: { frequence: coeurCount, populaire: coeurCount >= 10 },
          fond: { frequence: fondCount, populaire: fondCount >= 10 },
        },
        suggestedPositions,
        "stats.nombreParfums": totalUsage,
        "stats.derniereUtilisation": totalUsage > 0 ? new Date() : null,
      });

      updatedCount++;
    }

    console.log(`✅ ${updatedCount} notes mises à jour`);

    res.json({
      message: "Statistiques actualisées",
      updated: updatedCount,
    });
  } catch (error) {
    console.error("❌ Erreur refreshNoteStats:", error);
    res.status(500).json({
      message: "Erreur lors de l'actualisation",
      error: error.message,
    });
  }
};

// ✅ NOUVEAU : Obtenir les notes avec suggestions de position
export const getNotesWithSuggestions = async (req, res) => {
  try {
    const { search, famille } = req.query;

    const notes = await NoteOlfactive.searchWithSuggestions({
      search,
      famille,
    });

    // Grouper par famille pour l'affichage
    const notesByFamily = notes.reduce((acc, note) => {
      if (!acc[note.famille]) {
        acc[note.famille] = [];
      }
      acc[note.famille].push({
        _id: note._id,
        nom: note.nom,
        famille: note.famille,
        couleur: note.couleur,
        intensite: note.intensite,
        suggestedPositions: note.suggestedPositions,
        positionPreferee: note.positionPreferee,
        usages: note.usages,
        popularite: note.popularite,
      });
      return acc;
    }, {});

    res.json({
      notes,
      notesByFamily,
      total: notes.length,
    });
  } catch (error) {
    console.error("❌ Erreur getNotesWithSuggestions:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Obtenir une note par ID avec statistiques détaillées
export const getNoteById = async (req, res) => {
  try {
    const note = await NoteOlfactive.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note olfactive non trouvée" });
    }

    // Obtenir les parfums associés avec positions
    const parfumsTete = await Parfum.find({ notes_tete: note._id })
      .select("nom marque genre photo popularite")
      .sort({ popularite: -1 })
      .limit(5);

    const parfumsCoeur = await Parfum.find({ notes_coeur: note._id })
      .select("nom marque genre photo popularite")
      .sort({ popularite: -1 })
      .limit(5);

    const parfumsFond = await Parfum.find({ notes_fond: note._id })
      .select("nom marque genre photo popularite")
      .sort({ popularite: -1 })
      .limit(5);

    const parfumsParPosition = {
      tete: parfumsTete,
      coeur: parfumsCoeur,
      fond: parfumsFond,
    };

    const totalParfums =
      parfumsTete.length + parfumsCoeur.length + parfumsFond.length;

    res.json({
      note,
      parfumsParPosition,
      stats: {
        totalParfums,
        repartition: {
          tete: parfumsTete.length,
          coeur: parfumsCoeur.length,
          fond: parfumsFond.length,
        },
      },
    });
  } catch (error) {
    console.error("❌ Erreur getNoteById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Rechercher des notes olfactives
export const searchNotes = async (req, res) => {
  try {
    const { q, position, famille, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Terme de recherche requis" });
    }

    const query = {
      $or: [
        { nom: { $regex: q, $options: "i" } },
        { synonymes: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    };

    if (famille) {
      query.famille = famille;
    }

    if (position) {
      const key =
        position === "tête" ? "tete" : position === "cœur" ? "coeur" : "fond";
      query[`usages.${key}.frequence`] = { $gt: 0 };
    }

    const notes = await NoteOlfactive.find(query)
      .sort({ popularite: -1, nom: 1 })
      .limit(parseInt(limit));

    console.log(`🔍 Recherche "${q}": ${notes.length} résultats`);

    res.json(notes);
  } catch (error) {
    console.error("❌ Erreur searchNotes:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ NOUVEAU : Obtenir les familles olfactives disponibles
export const getFamilies = async (req, res) => {
  try {
    const families = await NoteOlfactive.distinct("famille");

    // Compter les notes par famille
    const familiesWithCount = await Promise.all(
      families.map(async (famille) => {
        const count = await NoteOlfactive.countDocuments({ famille });
        return { famille, count };
      })
    );

    res.json({
      families: familiesWithCount.sort((a, b) => b.count - a.count),
    });
  } catch (error) {
    console.error("❌ Erreur getFamilies:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ===== ROUTES ADMIN =====

// ✅ Créer une nouvelle note
export const createNote = async (req, res) => {
  try {
    const {
      nom,
      famille,
      description,
      suggestedPositions = [],
      intensite = 5,
      couleur = "#4a90e2",
      synonymes = [],
    } = req.body;

    // Vérifier l'unicité du nom
    const existingNote = await NoteOlfactive.findOne({
      nom: { $regex: `^${nom}$`, $options: "i" },
    });

    if (existingNote) {
      return res.status(409).json({
        message: "Une note avec ce nom existe déjà",
      });
    }

    const newNote = new NoteOlfactive({
      nom,
      famille,
      description,
      suggestedPositions,
      intensite,
      couleur,
      synonymes,
      usages: {
        tete: { frequence: 0, populaire: false },
        coeur: { frequence: 0, populaire: false },
        fond: { frequence: 0, populaire: false },
      },
    });

    await newNote.save();

    console.log(`✅ Note créée: ${nom}`);
    res.status(201).json(newNote);
  } catch (error) {
    console.error("❌ Erreur createNote:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Mettre à jour une note
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Ne pas permettre la modification des statistiques d'usage manuellement
    delete updateData.usages;
    delete updateData.stats;

    const note = await NoteOlfactive.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!note) {
      return res.status(404).json({ message: "Note non trouvée" });
    }

    console.log(`✅ Note mise à jour: ${note.nom}`);
    res.json(note);
  } catch (error) {
    console.error("❌ Erreur updateNote:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ Supprimer une note
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la note n'est utilisée dans aucun parfum
    const parfumsUtilisant = await Parfum.find({
      $or: [{ notes_tete: id }, { notes_coeur: id }, { notes_fond: id }],
    });

    if (parfumsUtilisant.length > 0) {
      return res.status(409).json({
        message: `Impossible de supprimer cette note, elle est utilisée dans ${parfumsUtilisant.length} parfum(s)`,
        parfums: parfumsUtilisant.map((p) => ({
          id: p._id,
          nom: p.nom,
          marque: p.marque,
        })),
      });
    }

    const note = await NoteOlfactive.findByIdAndDelete(id);

    if (!note) {
      return res.status(404).json({ message: "Note non trouvée" });
    }

    console.log(`🗑️ Note supprimée: ${note.nom}`);
    res.json({ message: "Note supprimée avec succès" });
  } catch (error) {
    console.error("❌ Erreur deleteNote:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
export const getNotesStats = async (req, res) => {
  try {
    console.log("📊 Génération des statistiques des notes...");

    const totalNotes = await NoteOlfactive.countDocuments();

    const notesByFamily = await NoteOlfactive.aggregate([
      { $group: { _id: "$famille", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const popularNotes = await NoteOlfactive.find({
      popularite: { $gte: 50 },
    }).countDocuments();

    const notesByPosition = await NoteOlfactive.aggregate([
      { $unwind: "$suggestedPositions" },
      { $group: { _id: "$suggestedPositions", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const mostUsedNotes = await NoteOlfactive.find()
      .sort({ "stats.nombreParfums": -1 })
      .limit(10)
      .select("nom famille stats.nombreParfums");

    const stats = {
      total: totalNotes,
      byFamily: notesByFamily,
      byPosition: notesByPosition,
      popular: popularNotes,
      mostUsed: mostUsedNotes,
      averageIntensity: await NoteOlfactive.aggregate([
        { $group: { _id: null, avg: { $avg: "$intensite" } } },
      ]).then((result) => result[0]?.avg || 0),
    };

    console.log(`✅ Statistiques générées: ${totalNotes} notes total`);
    res.json(stats);
  } catch (error) {
    console.error("❌ Erreur getNotesStats:", error);
    res.status(500).json({
      message: "Erreur lors de la génération des statistiques des notes",
      error: error.message,
    });
  }
};
