import Parfum from "../models/Parfum.js";
import NoteOlfactive from "../models/NoteOlfactive.js";
import csvService from "../services/csvService.js";
import mongoose from "mongoose";

/**
 * Obtenir tous les parfums avec filtres et recherche
 */
export const getParfums = async (req, res) => {
  try {
    const {
      search,
      genre,
      notes,
      page = 1,
      limit = 20,
      sortBy = "popularite",
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    let query = {};

    // ✅ RECHERCHE TEXTUELLE AMÉLIORÉE
    if (search) {
      const searchRegex = new RegExp(search, "i");

      // Rechercher aussi dans les notes olfactives
      const notesWithSearch = await NoteOlfactive.find({
        nom: searchRegex,
      }).select("_id");
      const noteIds = notesWithSearch.map((note) => note._id);

      query.$or = [
        { nom: searchRegex },
        { marque: searchRegex },
        { description: searchRegex },
        { notes: { $in: noteIds } },
      ];
    }

    // Filtre par genre
    if (genre && genre !== "tous") {
      query.genre = genre;
    }

    // Filtre par notes olfactives
    if (notes) {
      const noteIds = notes
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (noteIds.length > 0) {
        if (query.$or) {
          // Si on a déjà une recherche textuelle, on combine avec AND
          query = { $and: [{ $or: query.$or }, { notes: { $in: noteIds } }] };
        } else {
          query.notes = { $in: noteIds };
        }
      }
    }

    const skip = (pageNum - 1) * limitNum;

    // Options de tri
    const sortOptions = {};
    switch (sortBy) {
      case "nom":
        sortOptions.nom = 1;
        break;
      case "marque":
        sortOptions.marque = 1;
        break;
      case "recent":
        sortOptions.createdAt = -1;
        break;
      default:
        sortOptions.popularite = -1;
    }

    const parfums = await Parfum.find(query)
      .populate([
        { path: "notes_tete", select: "nom type famille" },
        { path: "notes_coeur", select: "nom type famille" },
        { path: "notes_fond", select: "nom type famille" },
      ])
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const total = await Parfum.countDocuments(query);

    console.log(`✅ Parfums trouvés: ${parfums.length}/${total}`);

    res.json({
      parfums,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Erreur getParfums:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * Recherche spécialisée de parfums
 */
export const searchParfums = async (req, res) => {
  try {
    const { q, notes, genre, marque } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        message: "Le terme de recherche doit contenir au moins 2 caractères",
      });
    }

    const searchRegex = new RegExp(q.trim(), "i");
    let query = {};

    // ✅ RECHERCHE MULTI-CRITÈRES
    // 1. Rechercher les notes correspondantes
    const matchingNotes = await NoteOlfactive.find({
      nom: searchRegex,
    }).select("_id");
    const noteIds = matchingNotes.map((note) => note._id);

    // 2. Construire la query principale
    const searchConditions = [
      { nom: searchRegex },
      { marque: searchRegex },
      { description: searchRegex },
    ];

    if (noteIds.length > 0) {
      searchConditions.push({ notes: { $in: noteIds } });
    }

    query.$or = searchConditions;

    // 3. Filtres additionnels
    if (notes) {
      const additionalNoteIds = notes
        .split(",")
        .map((id) => id.trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (additionalNoteIds.length > 0) {
        query = {
          $and: [{ $or: query.$or }, { notes: { $in: additionalNoteIds } }],
        };
      }
    }

    if (genre && genre !== "tous") {
      query.genre = genre;
    }

    if (marque) {
      query.marque = { $regex: marque, $options: "i" };
    }

    const parfums = await Parfum.find(query)
      .populate("notes", "nom type famille")
      .sort({ popularite: -1 })
      .limit(20);

    console.log(`🔍 Recherche "${q}": ${parfums.length} résultats`);

    res.json(parfums);
  } catch (error) {
    console.error("Erreur searchParfums:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * Obtenir un parfum par ID avec incrémentation popularité et historique
 */
export const getParfumById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    const parfum = await Parfum.findById(id)
      .populate("notes", "nom type description famille")
      .lean();

    if (!parfum) {
      return res.status(404).json({ message: "Parfum non trouvé" });
    }

    // ✅ Incrémenter popularité de façon asynchrone
    Parfum.findByIdAndUpdate(id, { $inc: { popularite: 1 } }).catch((err) =>
      console.warn("Erreur incrémentation popularité:", err)
    );

    console.log(`✅ Parfum récupéré: ${parfum.nom}`);

    res.json(parfum);
  } catch (error) {
    console.error("Erreur getParfumById:", error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

/**
 * Recherche par similarité basée sur plusieurs parfums
 */
export const getParfumsBySimilarity = async (req, res) => {
  try {
    const { parfumIds, limit = 10 } = req.body;

    if (!parfumIds || !Array.isArray(parfumIds) || parfumIds.length === 0) {
      return res.status(400).json({
        message: "Un tableau d'IDs de parfums est requis",
      });
    }

    // ✅ Validation des ObjectIds
    const validIds = parfumIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
    if (validIds.length === 0) {
      return res.status(400).json({ message: "Aucun ID valide fourni" });
    }

    const limitNum = Math.min(parseInt(limit, 10) || 10, 50);

    // Récupérer les parfums de référence
    const referenceParfums = await Parfum.find({
      _id: { $in: validIds },
    }).populate("notes");

    if (referenceParfums.length === 0) {
      return res.status(404).json({ message: "Aucun parfum trouvé" });
    }

    // Extraire toutes les notes uniques
    const allNoteIds = [
      ...new Set(
        referenceParfums.flatMap((p) => p.notes.map((n) => n._id.toString()))
      ),
    ];

    if (allNoteIds.length === 0) {
      return res.json({
        sourceParfums: referenceParfums.length,
        foundSimilar: 0,
        parfums: [],
      });
    }

    // Trouver des parfums similaires
    const similarParfums = await Parfum.find({
      _id: { $nin: validIds },
      notes: { $in: allNoteIds },
    })
      .populate("notes", "nom type famille")
      .sort({ popularite: -1 });

    // Calculer scores de similarité
    const parfumsWithScore = similarParfums
      .map((parfum) => {
        const parfumNoteIds = parfum.notes.map((n) => n._id.toString());
        const commonNotes = parfumNoteIds.filter((id) =>
          allNoteIds.includes(id)
        );

        return {
          ...parfum.toObject(),
          similarityScore: commonNotes.length,
          similarityPercentage: Math.round(
            (commonNotes.length / allNoteIds.length) * 100
          ),
          commonNotesCount: commonNotes.length,
        };
      })
      .filter((p) => p.similarityScore > 0)
      .sort((a, b) => {
        if (b.similarityScore !== a.similarityScore) {
          return b.similarityScore - a.similarityScore;
        }
        return b.popularite - a.popularite;
      })
      .slice(0, limitNum);

    console.log(`✅ Similarité: ${parfumsWithScore.length} parfums trouvés`);

    res.json({
      sourceParfums: referenceParfums.length,
      foundSimilar: parfumsWithScore.length,
      totalNotesAnalyzed: allNoteIds.length,
      parfums: parfumsWithScore,
    });
  } catch (error) {
    console.error("Erreur getParfumsBySimilarity:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * Obtenir des parfums similaires à un parfum spécifique
 */
export const getSimilarParfums = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    const parfum = await Parfum.findById(id).populate("notes");
    if (!parfum) {
      return res.status(404).json({ message: "Parfum non trouvé" });
    }

    const noteIds = parfum.notes.map((note) => note._id);

    const similaires = await Parfum.find({
      _id: { $ne: id },
      notes: { $in: noteIds },
    })
      .populate("notes", "nom type famille")
      .sort({ popularite: -1 })
      .limit(6);

    console.log(`✅ ${similaires.length} parfums similaires à ${parfum.nom}`);
    res.json(similaires);
  } catch (error) {
    console.error("Erreur getSimilarParfums:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * Obtenir parfums par note olfactive
 */
export const getParfumsByNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ message: "ID de note invalide" });
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const parfums = await Parfum.find({ notes: noteId })
      .populate("notes", "nom type famille")
      .sort({ popularite: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Parfum.countDocuments({ notes: noteId });

    console.log(`✅ ${parfums.length} parfums avec la note ${noteId}`);

    res.json({
      parfums,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Erreur getParfumsByNote:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// ✅ RESTE DES FONCTIONS INCHANGÉES
export const createParfum = async (req, res) => {
  try {
    const {
      nom,
      marque,
      genre,
      description,
      notes,
      liensMarchands,
      codeBarres,
      prix,
    } = req.body;

    // Vérifier que les notes existent
    if (notes && notes.length > 0) {
      const invalidNoteIds = notes.filter(
        (id) => !mongoose.Types.ObjectId.isValid(id)
      );
      if (invalidNoteIds.length > 0) {
        return res.status(400).json({
          message: "IDs de notes invalides",
          invalidIds: invalidNoteIds,
        });
      }

      const notesExistantes = await NoteOlfactive.find({ _id: { $in: notes } });
      if (notesExistantes.length !== notes.length) {
        return res
          .status(400)
          .json({ message: "Certaines notes olfactives n'existent pas" });
      }
    }

    const parfum = new Parfum({
      nom,
      marque,
      genre,
      description,
      notes: notes || [],
      liensMarchands: liensMarchands || [],
      codeBarres,
      prix,
      photo: req.file ? req.file.path : null,
    });

    await parfum.save();
    await parfum.populate("notes", "nom type famille");

    res.status(201).json(parfum);
  } catch (error) {
    console.error("Erreur createParfum:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const updateParfum = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    if (updateData.notes && updateData.notes.length > 0) {
      const invalidNoteIds = updateData.notes.filter(
        (noteId) => !mongoose.Types.ObjectId.isValid(noteId)
      );
      if (invalidNoteIds.length > 0) {
        return res.status(400).json({
          message: "IDs de notes invalides",
          invalidIds: invalidNoteIds,
        });
      }

      const notesExistantes = await NoteOlfactive.find({
        _id: { $in: updateData.notes },
      });
      if (notesExistantes.length !== updateData.notes.length) {
        return res
          .status(400)
          .json({ message: "Certaines notes olfactives n'existent pas" });
      }
    }

    if (req.file) {
      updateData.photo = req.file.path;
    }

    const parfum = await Parfum.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("notes", "nom type famille");

    if (!parfum) {
      return res.status(404).json({ message: "Parfum non trouvé" });
    }

    res.json(parfum);
  } catch (error) {
    console.error("Erreur updateParfum:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const deleteParfum = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    const parfum = await Parfum.findByIdAndDelete(id);

    if (!parfum) {
      return res.status(404).json({ message: "Parfum non trouvé" });
    }

    res.json({ message: "Parfum supprimé avec succès" });
  } catch (error) {
    console.error("Erreur deleteParfum:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const exportParfumsCSV = async (req, res) => {
  try {
    const parfums = await Parfum.find().populate("notes", "nom").lean();
    const csv = await csvService.exportParfums(parfums);

    res.header("Content-Type", "text/csv; charset=utf-8");
    res.header("Content-Disposition", "attachment; filename=parfums.csv");
    res.send(csv);
  } catch (error) {
    console.error("Erreur export CSV:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const importParfumsCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Fichier CSV requis" });
    }

    const result = await csvService.importParfums(req.file.path);

    // Nettoyer le fichier temporaire
    const fs = await import("fs");
    fs.unlinkSync(req.file.path);

    res.json({
      message: "Import terminé",
      ...result,
    });
  } catch (error) {
    console.error("Erreur import CSV:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const getParfumsStats = async (req, res) => {
  try {
    const totalParfums = await Parfum.countDocuments();

    const parGenre = await Parfum.aggregate([
      { $group: { _id: "$genre", count: { $sum: 1 } } },
    ]);

    const parMarque = await Parfum.aggregate([
      { $group: { _id: "$marque", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const plusPopulaires = await Parfum.find()
      .sort({ popularite: -1 })
      .limit(5)
      .select("nom marque popularite");

    res.json({
      totalParfums,
      parGenre,
      parMarque,
      plusPopulaires,
    });
  } catch (error) {
    console.error("Erreur getParfumsStats:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
