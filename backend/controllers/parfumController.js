import Parfum from "../models/Parfum.js";
import NoteOlfactive from "../models/NoteOlfactive.js";
import csvService from "../services/csvService.js";
import mongoose from "mongoose";

/**
 * Obtenir tous les parfums avec filtres (search, genre, notes), pagination et tri
 */
export const getParfums = async (req, res) => {
  try {
    const {
      search,
      genre,
      notes, // IDs de notes séparées par des virgules
      page = 1,
      limit = 20,
      sortBy = "popularite",
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100); // garde un plafond raisonnable
    const query = {};

    // Filtre par recherche textuelle
    if (search) {
      query.$or = [
        { nom: { $regex: search, $options: "i" } },
        { marque: { $regex: search, $options: "i" } },
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
        .filter(Boolean);

      if (noteIds.length > 0) {
        query.notes = { $in: noteIds };
      }
    }

    // Pagination
    const skip = (pageNum - 1) * limitNum;

    // Tri
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
      .populate("notes", "nom type famille")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const total = await Parfum.countDocuments(query);

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
 * Obtenir un parfum par ID
 */
export const getParfumById = async (req, res) => {
  try {
    const parfum = await Parfum.findById(req.params.id).populate(
      "notes",
      "nom type description famille"
    );

    if (!parfum) {
      return res.status(404).json({ message: "Parfum non trouvé" });
    }

    // Incrémenter la popularité (méthode de modèle)
    await parfum.incrementPopularite();

    res.json(parfum);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * Rechercher des parfums par note olfactive (noteId)
 */
export const getParfumsByNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const parfums = await Parfum.find({ notes: noteId })
      .populate("notes", "nom type famille")
      .sort({ popularite: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Parfum.countDocuments({ notes: noteId });

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
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * Obtenir des parfums similaires (basé sur un seul parfum)
 */
export const getSimilarParfums = async (req, res) => {
  try {
    const { id } = req.params;
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

    res.json(similaires);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * Recherche par similarité de plusieurs parfums
 */
export const getParfumsBySimilarity = async (req, res) => {
  try {
    const { parfumIds } = req.body;
    const { limit = 10 } = req.query;

    // Validation des paramètres
    if (!parfumIds || !Array.isArray(parfumIds) || parfumIds.length === 0) {
      return res.status(400).json({
        message: "Un tableau d'IDs de parfums est requis",
        exemple: {
          parfumIds: ["64f1234567890abcdef12345", "64f1234567890abcdef12346"],
        },
      });
    }

    const limitNum = Math.min(parseInt(limit, 10) || 10, 50);

    // Récupérer tous les parfums sélectionnés
    const parfums = await Parfum.find({ _id: { $in: parfumIds } }).populate(
      "notes"
    );

    if (parfums.length === 0) {
      return res
        .status(404)
        .json({ message: "Aucun parfum trouvé avec ces IDs" });
    }

    // Collecter toutes les notes uniques des parfums sélectionnés
    const noteIds = [
      ...new Set(
        parfums.flatMap((parfum) =>
          parfum.notes.map((note) => note._id.toString())
        )
      ),
    ];

    if (noteIds.length === 0) {
      return res.json({
        sourceParfums: parfums.length,
        foundSimilar: 0,
        parfums: [],
        message: "Aucune note trouvée dans les parfums sélectionnés",
      });
    }

    // Trouver des parfums similaires (excluant les parfums sélectionnés)
    const similaires = await Parfum.find({
      _id: { $nin: parfumIds },
      notes: { $in: noteIds },
    })
      .populate("notes", "nom type famille")
      .sort({ popularite: -1 });

    // Calculer un score de similarité basé sur les notes communes
    const parfumsAvecScore = similaires
      .map((parfum) => {
        const parfumNoteIds = parfum.notes.map((note) => note._id.toString());
        const notesCommunes = parfumNoteIds.filter((noteId) =>
          noteIds.includes(noteId)
        );

        const scoreBase = notesCommunes.length;
        const scoreNormalise =
          noteIds.length > 0 ? scoreBase / noteIds.length : 0;

        return {
          ...parfum.toObject(),
          similarityScore: scoreBase,
          similarityPercentage: Math.round(scoreNormalise * 100),
          commonNotesCount: notesCommunes.length,
          totalNotesAnalyzed: noteIds.length,
        };
      })
      .filter((parfum) => parfum.similarityScore > 0)
      .sort((a, b) => {
        // Trier d'abord par score, puis par popularité
        if (b.similarityScore !== a.similarityScore) {
          return b.similarityScore - a.similarityScore;
        }
        return b.popularite - a.popularite;
      })
      .slice(0, limitNum);

    res.json({
      sourceParfums: parfums.length,
      foundSimilar: parfumsAvecScore.length,
      totalNotesAnalyzed: noteIds.length,
      parfums: parfumsAvecScore,
    });
  } catch (error) {
    console.error("Erreur dans getParfumsBySimilarity:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * Créer un nouveau parfum (admin)
 */
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
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * Mettre à jour un parfum (admin)
 */
export const updateParfum = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier que les notes existent si elles sont fournies
    if (updateData.notes && updateData.notes.length > 0) {
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
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * Supprimer un parfum (admin)
 */
export const deleteParfum = async (req, res) => {
  try {
    const parfum = await Parfum.findByIdAndDelete(req.params.id);

    if (!parfum) {
      return res.status(404).json({ message: "Parfum non trouvé" });
    }

    res.json({ message: "Parfum supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * Recherche avancée incluant les notes :
 * - q : recherche dans nom/marque/description ET dans les noms de notes (conversion en noteIds)
 * - notes : filtre direct par IDs de notes
 */
export const searchParfums = async (req, res) => {
  try {
    const { q, notes, genre, marque } = req.query;

    const query = {};

    if (q) {
      // Recherche dans parfums ET dans les notes
      const noteIdsFromQuery = await NoteOlfactive.find({
        nom: { $regex: q, $options: "i" },
      }).distinct("_id");

      query.$or = [
        { nom: { $regex: q, $options: "i" } },
        { marque: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { notes: { $in: noteIdsFromQuery } },
      ];
    }

    if (notes) {
      const noteIds = notes
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      if (noteIds.length > 0) {
        // Si on a déjà un $or plus haut, on ajoute en conjonction
        if (query.$or) {
          query.$and = [{ $or: query.$or }, { notes: { $in: noteIds } }];
          delete query.$or;
        } else {
          query.notes = { $in: noteIds };
        }
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

    res.json(parfums);
  } catch (error) {
    console.error("Erreur searchParfums:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * Export CSV parfums (admin)
 */
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

/**
 * Import CSV parfums (admin)
 */
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
export const getParfumsBySimilarityMultiple = async (req, res) => {
  try {
    const { parfumIds, noteIds, genre, limit = 10 } = req.body;

    let baseQuery = {};

    // Filtres par notes ou parfums de référence
    if (noteIds && noteIds.length > 0) {
      baseQuery.notes = { $in: noteIds };
    }

    if (parfumIds && parfumIds.length > 0) {
      // Récupérer les notes des parfums de référence
      const referenceParfums = await Parfum.find({
        _id: { $in: parfumIds },
      }).populate("notes");
      const referenceNoteIds = [
        ...new Set(
          referenceParfums.flatMap((p) => p.notes.map((n) => n._id.toString()))
        ),
      ];

      baseQuery.notes = { $in: referenceNoteIds };
      baseQuery._id = { $nin: parfumIds }; // Exclure les parfums de référence
    }

    if (genre && genre !== "tous") {
      baseQuery.genre = genre;
    }

    const similaires = await Parfum.find(baseQuery)
      .populate("notes", "nom type famille")
      .sort({ popularite: -1 })
      .limit(parseInt(limit));

    res.json({
      parfums: similaires,
      total: similaires.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
/**
 * Obtenir les statistiques des parfums
 */
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
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
