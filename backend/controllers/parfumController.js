// backend/controllers/parfumController.js
import mongoose from "mongoose";
import Parfum from "../models/Parfum.js";
import NoteOlfactive from "../models/NoteOlfactive.js";
import csvService from "../services/csvService.js";
import {
  deleteParfumFromCloudinary,
  extractPublicIdFromUrl as extractPublicIdFromUrlFromConfig,
} from "../config/cloudinary.js";

/* --------------------------------------------
   Helpers
--------------------------------------------- */

/**
 * ✅ Extrait un public_id Cloudinary à partir d'une URL complète.
 * Version améliorée qui gère mieux la structure Cloudinary
 */
function extractPublicIdFromUrl(url) {
  if (!url || typeof url !== "string") return null;

  try {
    // Format typique: https://res.cloudinary.com/[cloud]/image/upload/v[version]/[folder]/[public_id].[format]
    const urlParts = url.split("/");
    const uploadIndex = urlParts.findIndex((part) => part === "upload");

    if (uploadIndex === -1) {
      // Fallback vers l'ancienne méthode si pas de structure standard
      const last = url.split("/").pop();
      return last ? last.split(".")[0] : null;
    }

    // Récupérer la partie après 'upload' et ignorer la version si présente
    let pathAfterUpload = urlParts.slice(uploadIndex + 1);

    // Si le premier élément commence par 'v', c'est un numéro de version, on l'ignore
    if (pathAfterUpload[0] && pathAfterUpload[0].startsWith("v")) {
      pathAfterUpload = pathAfterUpload.slice(1);
    }

    // Joindre le chemin et retirer l'extension
    const fullPath = pathAfterUpload.join("/");
    const publicId = fullPath.split(".")[0]; // Retirer l'extension

    console.log("🔍 Public ID extrait:", publicId, "depuis URL:", url);
    return publicId;
  } catch (error) {
    console.error("❌ Erreur extraction public_id:", error);
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
        {
          path: "notes_tete",
          select:
            "nom famille suggestedPositions usages couleur intensite popularite",
        },
        {
          path: "notes_coeur",
          select:
            "nom famille suggestedPositions usages couleur intensite popularite",
        },
        {
          path: "notes_fond",
          select:
            "nom famille suggestedPositions usages couleur intensite popularite",
        },
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
        {
          path: "notes_tete",
          select: "nom famille suggestedPositions usages couleur",
        },
        {
          path: "notes_coeur",
          select: "nom famille suggestedPositions usages couleur",
        },
        {
          path: "notes_fond",
          select: "nom famille suggestedPositions usages couleur",
        },
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
      {
        path: "notes_tete",
        select: "nom famille suggestedPositions usages couleur",
      },
      {
        path: "notes_coeur",
        select: "nom famille suggestedPositions usages couleur",
      },
      {
        path: "notes_fond",
        select: "nom famille suggestedPositions usages couleur",
      },
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
        {
          path: "notes_tete",
          select: "nom famille suggestedPositions usages couleur",
        },
        {
          path: "notes_coeur",
          select: "nom famille suggestedPositions usages couleur",
        },
        {
          path: "notes_fond",
          select: "nom famille suggestedPositions usages couleur",
        },
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
        {
          path: "notes_tete",
          select: "nom famille suggestedPositions usages couleur",
        },
        {
          path: "notes_coeur",
          select: "nom famille suggestedPositions usages couleur",
        },
        {
          path: "notes_fond",
          select: "nom famille suggestedPositions usages couleur",
        },
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
        {
          path: "notes_tete",
          select: "nom famille suggestedPositions usages couleur",
        },
        {
          path: "notes_coeur",
          select: "nom famille suggestedPositions usages couleur",
        },
        {
          path: "notes_fond",
          select: "nom famille suggestedPositions usages couleur",
        },
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
   ✅ CRUD avec gestion Cloudinary - VERSION CORRIGÉE & UNIFIÉE
   =========================== */

/**
 * ✅ createParfum — version corrigée
 * - Utilise req.validatedData si présent (ex: middleware de validation)
 * - Validation des notes + messages d'erreur détaillés
 * - Gestion robuste de l’URL image (secure_url > url > path) ou imageUrl
 * - Compatibilité concentration/concentre
 */
export const createParfum = async (req, res) => {
  try {
    console.log("🔍 DEBUG createParfum - req.file:", req.file);
    console.log(
      "🔍 DEBUG createParfum - req.validatedData:",
      req.validatedData
    );

    // ✅ Utiliser req.validatedData si fourni par un middleware de validation
    const validatedData = req.validatedData || req.body;

    // Vérifier les notes si elles existent
    const allNotes = [
      ...(validatedData.notes_tete || []),
      ...(validatedData.notes_coeur || []),
      ...(validatedData.notes_fond || []),
    ];

    console.log("🔍 DEBUG - Notes à vérifier:", allNotes);

    if (allNotes.length > 0) {
      const invalidNoteIds = allNotes.filter(
        (noteId) => !mongoose.Types.ObjectId.isValid(noteId)
      );

      if (invalidNoteIds.length > 0) {
        console.error("❌ IDs de notes invalides:", invalidNoteIds);
        return res.status(400).json({
          message: "IDs de notes invalides",
          invalidIds: invalidNoteIds,
        });
      }

      const notesExistantes = await NoteOlfactive.find({
        _id: { $in: allNotes },
      });

      console.log(
        `🔍 DEBUG - ${allNotes.length} notes à vérifier, ${notesExistantes.length} trouvées`
      );

      if (notesExistantes.length !== allNotes.length) {
        const notesExistantesIds = notesExistantes.map((n) => n._id.toString());
        const notesMissingIds = allNotes.filter(
          (id) => !notesExistantesIds.includes(id)
        );

        console.error("❌ Notes manquantes:", notesMissingIds);
        return res.status(400).json({
          message: "Certaines notes olfactives n'existent pas",
          missingNotes: notesMissingIds,
        });
      }
    }

    // ✅ Gestion robuste de l'URL image
    let photoUrl = null;
    if (req.file) {
      if (req.file.secure_url && typeof req.file.secure_url === "string") {
        photoUrl = req.file.secure_url;
      } else if (req.file.url && typeof req.file.url === "string") {
        photoUrl = req.file.url;
      } else if (req.file.path && typeof req.file.path === "string") {
        photoUrl = req.file.path;
      }

      if (!photoUrl) {
        return res.status(400).json({
          message: "Erreur upload image - URL non disponible",
        });
      }
    } else if (validatedData.imageUrl) {
      photoUrl = validatedData.imageUrl;
    }

    // Compatibilité du champ concentration/concentre
    const concentration =
      validatedData.concentration ?? validatedData.concentre ?? undefined;

    // ✅ Création du parfum avec les données validées
    const parfum = new Parfum({
      nom: validatedData.nom,
      marque: validatedData.marque,
      genre: validatedData.genre,
      description: validatedData.description || "",
      notes_tete: validatedData.notes_tete || [],
      notes_coeur: validatedData.notes_coeur || [],
      notes_fond: validatedData.notes_fond || [],
      prix:
        validatedData.prix !== undefined && validatedData.prix !== null
          ? validatedData.prix
          : null,
      liensMarchands: validatedData.liensMarchands || [],
      codeBarres: validatedData.codeBarres || undefined,
      photo: photoUrl, // URL Cloudinary ou externe
      anneeSortie: validatedData.anneeSortie || new Date().getFullYear(), // garde ton défaut d'avant
      concentration, // compatibilité
      popularite: validatedData.popularite || 0,
      longevite: validatedData.longevite || "",
      sillage: validatedData.sillage || "",
    });

    console.log("🔍 DEBUG - Parfum à sauvegarder:", parfum);

    await parfum.save();
    await parfum.populate([
      {
        path: "notes_tete",
        select: "nom famille suggestedPositions usages couleur",
      },
      {
        path: "notes_coeur",
        select: "nom famille suggestedPositions usages couleur",
      },
      {
        path: "notes_fond",
        select: "nom famille suggestedPositions usages couleur",
      },
    ]);

    console.log("✅ Parfum créé avec succès - photo:", parfum.photo);
    res.status(201).json(parfum);
  } catch (error) {
    console.error("❌ Erreur createParfum:", error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

/**
 * ✅ updateParfum — version corrigée
 * - Utilise req.validatedData si présent
 * - Validation des notes
 * - Gestion de l’image (upload OU URL manuelle)
 * - ✅ Conserve ta logique existante de suppression de l’ancienne image Cloudinary
 * - Garde le nettoyage des champs & conversions numériques
 */
export const updateParfum = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Utiliser req.validatedData si fourni par un middleware de validation
    const validatedData = req.validatedData || req.body;

    console.log("🔍 DEBUG updateParfum - ID:", id);
    console.log("🔍 DEBUG updateParfum - validatedData:", validatedData);
    console.log("🔍 DEBUG updateParfum - req.file:", req.file);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    // Vérifier les notes si elles sont mises à jour
    const allNotes = [
      ...(validatedData.notes_tete || []),
      ...(validatedData.notes_coeur || []),
      ...(validatedData.notes_fond || []),
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

    // Gestion de l'image
    let updateData = { ...validatedData };

    if (req.file) {
      // Ordre de priorité: secure_url > url > path
      let newPhotoUrl = null;
      if (req.file.secure_url && typeof req.file.secure_url === "string") {
        newPhotoUrl = req.file.secure_url;
      } else if (req.file.url && typeof req.file.url === "string") {
        newPhotoUrl = req.file.url;
      } else if (req.file.path && typeof req.file.path === "string") {
        newPhotoUrl = req.file.path;
      } else {
        console.error("❌ Aucune URL valide trouvée dans req.file:", req.file);
        return res.status(400).json({
          message: "Erreur upload image - URL non disponible",
          debug: { file: req.file },
        });
      }

      console.log("✅ Nouvelle image reçue (upload):", {
        originalname: req.file.originalname,
        url: newPhotoUrl,
        public_id: req.file.public_id || "N/A",
      });

      // ✅ Supprimer l'ancienne image si elle existe (on conserve ta logique)
      const oldParfum = await Parfum.findById(id).select("photo");
      if (oldParfum && oldParfum.photo) {
        try {
          const publicId =
            extractPublicIdFromUrl(oldParfum.photo) ??
            extractPublicIdFromUrlFromConfig(oldParfum.photo);
          if (publicId) {
            await deleteParfumFromCloudinary(publicId);
            console.log("✅ Ancienne image supprimée:", publicId);
          }
        } catch (deleteError) {
          console.warn(
            "⚠️ Erreur suppression ancienne image:",
            deleteError.message
          );
        }
      }

      updateData.photo = newPhotoUrl;
    } else if (validatedData.imageUrl && validatedData.imageUrl.trim() !== "") {
      // Cas URL manuelle
      updateData.photo = validatedData.imageUrl.trim();
      // Note: on ne supprime pas l’ancienne image Cloudinary dans ce cas
    }

    // Nettoyer imageUrl des updateData
    delete updateData.imageUrl;

    // ✅ PROTECTION: Nettoyer updateData des objets non désirés (on garde ta logique)
    Object.keys(updateData).forEach((key) => {
      const value = updateData[key];
      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        console.warn(`⚠️ Suppression du champ objet ${key}:`, value);
        delete updateData[key];
      }
    });

    // ✅ Validation / conversions numériques (on conserve)
    if (updateData.anneeSortie) {
      updateData.anneeSortie = parseInt(updateData.anneeSortie, 10);
    }
    if (updateData.popularite !== undefined) {
      updateData.popularite = parseInt(updateData.popularite, 10) || 0;
    }

    // Compatibilité concentration/concentre
    if (
      updateData.concentration === undefined &&
      updateData.concentre !== undefined
    ) {
      updateData.concentration = updateData.concentre;
    }
    delete updateData.concentre; // on unifie côté BDD

    console.log("🔍 DEBUG updateData final:", updateData);

    const parfum = await Parfum.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate([
      {
        path: "notes_tete",
        select: "nom famille suggestedPositions usages couleur",
      },
      {
        path: "notes_coeur",
        select: "nom famille suggestedPositions usages couleur",
      },
      {
        path: "notes_fond",
        select: "nom famille suggestedPositions usages couleur",
      },
    ]);

    if (!parfum) {
      return res.status(404).json({ message: "Parfum non trouvé" });
    }

    console.log("✅ Parfum mis à jour avec succès - photo:", parfum.photo);
    res.json(parfum);
  } catch (error) {
    console.error("❌ Erreur updateParfum:", error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

/**
 * ✅ deleteParfum — version conservée (suppression image Cloudinary si présente)
 */
export const deleteParfum = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔍 DEBUG deleteParfum - ID:", id);

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
        const publicId =
          extractPublicIdFromUrl(parfum.photo) ??
          extractPublicIdFromUrlFromConfig(parfum.photo);
        if (publicId) {
          await deleteParfumFromCloudinary(publicId);
          console.log("✅ Image supprimée de Cloudinary:", publicId);
        }
      } catch (deleteError) {
        console.warn(
          "⚠️ Erreur suppression image Cloudinary:",
          deleteError.message
        );
        // On continue malgré l'erreur de suppression d'image
      }
    }

    await Parfum.findByIdAndDelete(id);
    console.log("✅ Parfum supprimé avec succès");
    res.json({ message: "Parfum supprimé avec succès" });
  } catch (error) {
    console.error("❌ Erreur deleteParfum:", error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
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

    console.log("🔍 DEBUG importCSV - req.file:", req.file);

    // ✅ Gestion robuste du path/URL pour CSV
    let filePath = null;
    if (req.file.path && typeof req.file.path === "string") {
      filePath = req.file.path;
    } else if (req.file.url && typeof req.file.url === "string") {
      filePath = req.file.url;
    } else if (req.file.secure_url && typeof req.file.secure_url === "string") {
      filePath = req.file.secure_url;
    } else {
      console.error(
        "❌ Impossible de récupérer le chemin du fichier CSV:",
        req.file
      );
      return res.status(400).json({
        message: "Erreur lecture fichier CSV - chemin non disponible",
        debug: { file: req.file },
      });
    }

    console.log("✅ Traitement du fichier CSV:", filePath);
    const result = await csvService.importParfums(filePath);

    res.json({
      message: "Import terminé",
      ...result,
    });
  } catch (error) {
    console.error("❌ Erreur import CSV:", error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
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
