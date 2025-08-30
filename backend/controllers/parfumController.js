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
        // ✅ CORRIGER : Rechercher dans les 3 champs de notes
        { notes_tete: { $in: noteIds } },
        { notes_coeur: { $in: noteIds } },
        { notes_fond: { $in: noteIds } },
      ];
    }

    // Filtre par genre
    if (genre && genre !== "tous") {
      query.genre = genre;
    }

    // ✅ CORRIGER : Filtre par notes olfactives dans les 3 champs
    // ✅ Dans getParfums(), remplacer la section filtre notes par:
    if (notes) {
      const noteIds = notes
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (noteIds.length > 0) {
        // Pour que TOUTES les notes soient présentes (Jasmin ET Vanille)
        const noteConditions = noteIds.map((noteId) => ({
          $or: [
            { notes_tete: noteId },
            { notes_coeur: noteId },
            { notes_fond: noteId },
          ],
        }));

        const noteQuery = { $and: noteConditions };

        if (query.$or) {
          query = { $and: [{ $or: query.$or }, noteQuery] };
        } else {
          query = noteQuery;
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

    // ✅ CORRIGER : Population des 3 champs de notes séparément
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
 * ✅ CORRIGER : Recherche spécialisée de parfums
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
    const matchingNotes = await NoteOlfactive.find({
      nom: searchRegex,
    }).select("_id");
    const noteIds = matchingNotes.map((note) => note._id);

    const searchConditions = [
      { nom: searchRegex },
      { marque: searchRegex },
      { description: searchRegex },
    ];

    if (noteIds.length > 0) {
      searchConditions.push(
        { notes_tete: { $in: noteIds } },
        { notes_coeur: { $in: noteIds } },
        { notes_fond: { $in: noteIds } }
      );
    }

    query.$or = searchConditions;

    // Filtres additionnels
    if (genre && genre !== "tous") {
      query.genre = genre;
    }
    if (marque) {
      query.marque = new RegExp(marque, "i");
    }

    const parfums = await Parfum.find(query)
      .populate([
        { path: "notes_tete", select: "nom type famille" },
        { path: "notes_coeur", select: "nom type famille" },
        { path: "notes_fond", select: "nom type famille" },
      ])
      .sort({ popularite: -1 })
      .limit(20);

    res.json(parfums);
  } catch (error) {
    console.error("Erreur searchParfums:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * ✅ CORRIGER : Obtenir un parfum par ID
 */
export const getParfumById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    const parfum = await Parfum.findById(id).populate([
      { path: "notes_tete", select: "nom type famille" },
      { path: "notes_coeur", select: "nom type famille" },
      { path: "notes_fond", select: "nom type famille" },
    ]);

    if (!parfum) {
      return res.status(404).json({ message: "Parfum non trouvé" });
    }

    // Incrémenter popularité de façon asynchrone (non bloquant)
    Parfum.findByIdAndUpdate(id, { $inc: { popularite: 1 } }).catch((err) =>
      console.warn("Erreur incrémentation popularité:", err)
    );

    console.log(`✅ Parfum récupéré: ${parfum.nom}`);
    res.json(parfum);
  } catch (error) {
    console.error("Erreur getParfumById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * ✅ CORRIGER : Obtenir des parfums similaires à un parfum spécifique
 */
export const getSimilarParfums = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    const parfum = await Parfum.findById(id).populate([
      "notes_tete",
      "notes_coeur",
      "notes_fond",
    ]);

    if (!parfum) {
      return res.status(404).json({ message: "Parfum non trouvé" });
    }

    // Combiner toutes les notes du parfum
    const allNoteIds = [
      ...(parfum.notes_tete || []).map((n) => n._id),
      ...(parfum.notes_coeur || []).map((n) => n._id),
      ...(parfum.notes_fond || []).map((n) => n._id),
    ];

    const similaires = await Parfum.find({
      _id: { $ne: id },
      $or: [
        { notes_tete: { $in: allNoteIds } },
        { notes_coeur: { $in: allNoteIds } },
        { notes_fond: { $in: allNoteIds } },
      ],
    })
      .populate([
        { path: "notes_tete", select: "nom type famille" },
        { path: "notes_coeur", select: "nom type famille" },
        { path: "notes_fond", select: "nom type famille" },
      ])
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
 * ✅ CORRIGER : Obtenir parfums par note olfactive
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

    // ✅ Chercher dans les 3 champs de notes
    const parfums = await Parfum.find({
      $or: [
        { notes_tete: noteId },
        { notes_coeur: noteId },
        { notes_fond: noteId },
      ],
    })
      .populate([
        { path: "notes_tete", select: "nom type famille" },
        { path: "notes_coeur", select: "nom type famille" },
        { path: "notes_fond", select: "nom type famille" },
      ])
      .sort({ popularite: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Parfum.countDocuments({
      $or: [
        { notes_tete: noteId },
        { notes_coeur: noteId },
        { notes_fond: noteId },
      ],
    });

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

    // Récupérer les parfums de référence avec les 3 champs
    const referenceParfums = await Parfum.find({
      _id: { $in: validIds },
    }).populate(["notes_tete", "notes_coeur", "notes_fond"]);

    if (referenceParfums.length === 0) {
      return res.status(404).json({ message: "Aucun parfum trouvé" });
    }

    // Extraire toutes les notes uniques des 3 champs
    const allNoteIds = [
      ...new Set(
        referenceParfums.flatMap((p) => [
          ...(p.notes_tete || []).map((n) => n._id.toString()),
          ...(p.notes_coeur || []).map((n) => n._id.toString()),
          ...(p.notes_fond || []).map((n) => n._id.toString()),
        ])
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
      $or: [
        { notes_tete: { $in: allNoteIds } },
        { notes_coeur: { $in: allNoteIds } },
        { notes_fond: { $in: allNoteIds } },
      ],
    })
      .populate([
        { path: "notes_tete", select: "nom type famille" },
        { path: "notes_coeur", select: "nom type famille" },
        { path: "notes_fond", select: "nom type famille" },
      ])
      .sort({ popularite: -1 });

    // Calculer scores de similarité
    const parfumsWithScore = similarParfums
      .map((parfum) => {
        const parfumNoteIds = [
          ...(parfum.notes_tete || []).map((n) => n._id.toString()),
          ...(parfum.notes_coeur || []).map((n) => n._id.toString()),
          ...(parfum.notes_fond || []).map((n) => n._id.toString()),
        ];
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

// ✅ AUTRES FONCTIONS CORRIGÉES
export const createParfum = async (req, res) => {
  try {
    const {
      nom,
      marque,
      genre,
      description,
      notes_tete,
      notes_coeur,
      notes_fond,
      liensMarchands,
      codeBarres,
      prix,
    } = req.body;

    // Vérifier que les notes existent si fournies
    const allNotes = [
      ...(notes_tete || []),
      ...(notes_coeur || []),
      ...(notes_fond || []),
    ];

    if (allNotes.length > 0) {
      const invalidNoteIds = allNotes.filter(
        (id) => !mongoose.Types.ObjectId.isValid(id)
      );
      if (invalidNoteIds.length > 0) {
        return res.status(400).json({
          message: "IDs de notes invalides",
          invalidIds: invalidNoteIds,
        });
      }

      const notesExistantes = await NoteOlfactive.find({
        _id: { $in: allNotes },
      });
      if (notesExistantes.length !== allNotes.length) {
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
      notes_tete: notes_tete || [],
      notes_coeur: notes_coeur || [],
      notes_fond: notes_fond || [],
      liensMarchands: liensMarchands || [],
      codeBarres,
      prix,
      photo: req.file ? req.file.path : null,
    });

    await parfum.save();
    await parfum.populate([
      { path: "notes_tete", select: "nom type famille" },
      { path: "notes_coeur", select: "nom type famille" },
      { path: "notes_fond", select: "nom type famille" },
    ]);

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

    // Vérifier les notes si elles sont mises à jour
    const allNotes = [
      ...(updateData.notes_tete || []),
      ...(updateData.notes_coeur || []),
      ...(updateData.notes_fond || []),
    ];

    if (allNotes.length > 0) {
      const invalidNoteIds = allNotes.filter(
        (noteId) => !mongoose.Types.ObjectId.isValid(noteId)
      );
      if (invalidNoteIds.length > 0) {
        return res.status(400).json({
          message: "IDs de notes invalides",
          invalidIds: invalidNoteIds,
        });
      }

      const notesExistantes = await NoteOlfactive.find({
        _id: { $in: allNotes },
      });
      if (notesExistantes.length !== allNotes.length) {
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
    }).populate([
      { path: "notes_tete", select: "nom type famille" },
      { path: "notes_coeur", select: "nom type famille" },
      { path: "notes_fond", select: "nom type famille" },
    ]);

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
    const parfums = await Parfum.find()
      .populate(["notes_tete", "notes_coeur", "notes_fond"])
      .lean();
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
