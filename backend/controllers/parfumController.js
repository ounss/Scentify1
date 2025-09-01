// backend/controllers/parfumController.js
import mongoose from "mongoose";
import Parfum from "../models/Parfum.js";
import NoteOlfactive from "../models/NoteOlfactive.js";
import csvService from "../services/csvService.js";
import { deleteParfumFromCloudinary } from "../config/cloudinary.js";

/* --------------------------------------------
   Helpers
--------------------------------------------- */

/**
 * Extrait un public_id Cloudinary à partir d'une URL complète.
 * Exemple:
 *   https://res.cloudinary.com/.../upload/v172.../scentify/parfums/abcd1234.jpg
 * -> "abcd1234"
 */
function extractPublicIdFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const last = url.split("/").pop(); // abcd1234.jpg
    if (!last) return null;
    return last.split(".")[0]; // abcd1234
  } catch {
    return null;
  }
}

/* ===========================
   ✅ Listing & Recherche
   =========================== */

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
        { notes_tete: { $in: noteIds } },
        { notes_coeur: { $in: noteIds } },
        { notes_fond: { $in: noteIds } },
      ];
    }

    // Filtre par genre
    if (genre && genre !== "tous") {
      query.genre = genre;
    }

    // ✅ Filtre par notes (les 3 champs, toutes les notes demandées doivent être présentes)
    if (notes) {
      const noteIds = notes
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (noteIds.length > 0) {
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
 * ✅ Recherche spécialisée de parfums
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
    if (genre && genre !== "tous") query.genre = genre;
    if (marque) query.marque = new RegExp(marque, "i");

    // Si on reçoit aussi "notes" en paramètre, applique-le strictement
    if (notes) {
      const ids = notes
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (ids.length > 0) {
        query = {
          $and: [
            query,
            {
              $and: ids.map((noteId) => ({
                $or: [
                  { notes_tete: noteId },
                  { notes_coeur: noteId },
                  { notes_fond: noteId },
                ],
              })),
            },
          ],
        };
      }
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
 * ✅ Obtenir un parfum par ID
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

    res.json(parfum);
  } catch (error) {
    console.error("Erreur getParfumById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * ✅ Obtenir des parfums similaires à un parfum spécifique
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

    res.json(similaires);
  } catch (error) {
    console.error("Erreur getSimilarParfums:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/**
 * ✅ Obtenir parfums par note olfactive
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

    const validIds = parfumIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
    if (validIds.length === 0) {
      return res.status(400).json({ message: "Aucun ID valide fourni" });
    }

    const limitNum = Math.min(parseInt(limit, 10) || 10, 50);

    const referenceParfums = await Parfum.find({
      _id: { $in: validIds },
    }).populate(["notes_tete", "notes_coeur", "notes_fond"]);

    if (referenceParfums.length === 0) {
      return res.status(404).json({ message: "Aucun parfum trouvé" });
    }

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

/* ===========================
   ✅ CRUD avec gestion Cloudinary
   =========================== */

/**
 * ✅ createParfum — version corrigée avec req.file.url / req.file.secure_url
 */
export const createParfum = async (req, res) => {
  try {
    // Vérifier les notes si elles existent
    const allNotes = [
      ...(req.body.notes_tete || []),
      ...(req.body.notes_coeur || []),
      ...(req.body.notes_fond || []),
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

    // ✅ Cloudinary: privilégier url/secure_url, fallback path
    let photoUrl = null;
    if (req.file) {
      photoUrl = req.file.url || req.file.secure_url || req.file.path || null;
      console.log("📸 Image uploadée:", {
        originalname: req.file.originalname,
        url: photoUrl,
        public_id: req.file.public_id,
      });
    }

    const parfum = new Parfum({
      nom: req.body.nom,
      marque: req.body.marque,
      genre: req.body.genre,
      description: req.body.description || "",
      notes_tete: req.body.notes_tete || [],
      notes_coeur: req.body.notes_coeur || [],
      notes_fond: req.body.notes_fond || [],
      prix: req.body.prix || null,
      liensMarchands: req.body.liensMarchands || [],
      codeBarres: req.body.codeBarres || null,
      // ✅ URL Cloudinary stockée en string
      photo: photoUrl,
      // Champs optionnels si présents dans ton schéma
      anneeSortie: req.body.anneeSortie, // (laisser tel quel si non défini)
      concentration: req.body.concentration,
      popularite: req.body.popularite,
      longevite: req.body.longevite,
      sillage: req.body.sillage,
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

/**
 * ✅ updateParfum — remplace l'image sur Cloudinary si nouvelle image
 * (utilise req.file.url / req.file.secure_url / req.file.path)
 */
export const updateParfum = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body }; // éviter mutation

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

    // ✅ Gestion de l'image Cloudinary si une nouvelle image est uploadée
    if (req.file) {
      const newPhotoUrl =
        req.file.url || req.file.secure_url || req.file.path || null;

      console.log("📸 Nouvelle image reçue:", {
        originalname: req.file.originalname,
        url: newPhotoUrl,
        public_id: req.file.public_id,
      });

      // récupérer l'ancienne photo pour suppression
      const oldParfum = await Parfum.findById(id).select("photo");
      if (oldParfum && oldParfum.photo) {
        try {
          const publicId = extractPublicIdFromUrl(oldParfum.photo);
          if (publicId) {
            // on reconstitue avec ton dossier s'il est utilisé côté upload
            await deleteParfumFromCloudinary(`scentify/parfums/${publicId}`);
          }
        } catch (deleteError) {
          console.warn("⚠️ Erreur suppression ancienne image:", deleteError);
        }
      }

      updateData.photo = newPhotoUrl; // ✅ met à jour avec l'URL Cloudinary
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

/**
 * ✅ deleteParfum — supprime aussi l'image Cloudinary si présente
 */
export const deleteParfum = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    const parfum = await Parfum.findById(id);
    if (!parfum) {
      return res.status(404).json({ message: "Parfum non trouvé" });
    }

    // ✅ Supprimer l'image Cloudinary si elle existe
    if (parfum.photo) {
      try {
        const publicId = extractPublicIdFromUrl(parfum.photo);
        if (publicId) {
          await deleteParfumFromCloudinary(`scentify/parfums/${publicId}`);
        }
      } catch (deleteError) {
        console.warn("⚠️ Erreur suppression image Cloudinary:", deleteError);
      }
    }

    await Parfum.findByIdAndDelete(id);
    res.json({ message: "Parfum supprimé avec succès" });
  } catch (error) {
    console.error("Erreur deleteParfum:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================
   ✅ Export / Import CSV
   =========================== */

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

    // ⚠️ Avec stockage distant, req.file.path peut être une URL.
    // On conserve la compatibilité avec ton csvService.
    const result = await csvService.importParfums(req.file.path);

    res.json({
      message: "Import terminé",
      ...result,
    });
  } catch (error) {
    console.error("Erreur import CSV:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================
   ✅ Stats
   =========================== */

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
