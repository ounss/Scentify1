// backend/controllers/parfumController.js
import mongoose from "mongoose";
import Parfum from "../models/Parfum.js";
import NoteOlfactive from "../models/NoteOlfactive.js";
import csvService from "../services/csvService.js";

/* ========================================================================
   Constantes & Helpers
   ======================================================================== */

const POPULATE_NOTES = [
  { path: "notes_tete", select: "nom type famille" },
  { path: "notes_coeur", select: "nom type famille" },
  { path: "notes_fond", select: "nom type famille" },
];

const isObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(String(v || ""));

/** Convertit un paramètre "notes" (ids ou noms, séparés par virgules) en tableau d'ObjectId */
async function parseNotesToIds(notesParam) {
  if (!notesParam) return [];

  const tokens = Array.isArray(notesParam)
    ? notesParam
    : String(notesParam)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  const ids = [];
  const nameQueries = [];

  for (const t of tokens) {
    if (isObjectId(t)) {
      ids.push(new mongoose.Types.ObjectId(t));
    } else {
      nameQueries.push({
        $or: [
          { nom: { $regex: t, $options: "i" } },
          { synonymes: { $regex: t, $options: "i" } },
        ],
      });
    }
  }

  if (nameQueries.length) {
    const found = await NoteOlfactive.find({ $or: nameQueries }).select("_id");
    found.forEach((n) => ids.push(n._id));
  }
  return ids;
}

/** Construit un filtre Mongo pour matcher des notes dans n'importe quel champ (tête/coeur/fond) */
function buildNotesFilter(noteIds) {
  if (!noteIds?.length) return {};
  return {
    $or: [
      { notes_tete: { $in: noteIds } },
      { notes_coeur: { $in: noteIds } },
      { notes_fond: { $in: noteIds } },
    ],
  };
}

/** Récupère toutes les notes d'un parfum sous forme de tableau d'ObjectId (tête ∪ cœur ∪ fond) */
function collectAllNotesIdsFromParfum(parfumDoc) {
  const a = (parfumDoc.notes_tete || []).map(String);
  const b = (parfumDoc.notes_coeur || []).map(String);
  const c = (parfumDoc.notes_fond || []).map(String);
  return [...new Set([...a, ...b, ...c])];
}

/** Vérifie qu'un tableau d'ids correspond à des NoteOlfactive existantes */
async function validateNotesExist(ids = []) {
  const validIds = ids.filter((id) => isObjectId(id));
  if (validIds.length !== ids.length) {
    const invalid = ids.filter((id) => !isObjectId(id));
    return { ok: false, invalid };
  }
  const count = await NoteOlfactive.countDocuments({ _id: { $in: validIds } });
  if (count !== validIds.length) {
    return { ok: false, invalid: "Certaines notes n'existent pas" };
  }
  return { ok: true };
}

/* ========================================================================
   GET /api/parfums - liste avec recherche/tri/pagination
   Query: search, genre, notes(IDs ou noms), page, limit, sortBy(popularite|nom|recent|prix), minPrix, maxPrix
   ======================================================================== */
export const getParfums = async (req, res) => {
  try {
    const {
      search,
      genre,
      notes,
      page = 1,
      limit = 20,
      sortBy = "popularite",
      minPrix,
      maxPrix,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

    const query = {};

    // Recherche texte
    if (search && search.trim()) {
      const r = new RegExp(search.trim(), "i");
      query.$or = [{ nom: r }, { marque: r }, { description: r }];
      // Recherche par nom/synonyme de note -> ajoute un OR supplémentaire
      const noteIdsFromSearch = await parseNotesToIds(search);
      if (noteIdsFromSearch.length) {
        query.$or.push(
          ...[
            { notes_tete: { $in: noteIdsFromSearch } },
            { notes_coeur: { $in: noteIdsFromSearch } },
            { notes_fond: { $in: noteIdsFromSearch } },
          ]
        );
      }
    }

    // Genre
    if (genre && ["homme", "femme", "mixte"].includes(genre)) {
      query.genre = genre;
    }

    // Filtre par notes (paramètre notes = ids ou noms)
    const noteIdsFilter = await parseNotesToIds(notes);
    if (noteIdsFilter.length) {
      const notesClause = buildNotesFilter(noteIdsFilter);
      if (query.$or) {
        // combiner correctement si on a déjà un $or
        Object.assign(query, { $and: [{ $or: query.$or }, notesClause] });
        delete query.$or;
      } else {
        Object.assign(query, notesClause);
      }
    }

    // Fourchette prix (sur meilleurPrix si présent, sinon prix)
    if (minPrix || maxPrix) {
      const min = Number(minPrix ?? 0);
      const max = Number(maxPrix ?? Number.MAX_SAFE_INTEGER);
      query.$or = [
        { meilleurPrix: { $gte: min, $lte: max } },
        { prix: { $gte: min, $lte: max } },
      ];
    }

    // Tri
    const sort =
      sortBy === "nom"
        ? { nom: 1 }
        : sortBy === "recent"
        ? { createdAt: -1 }
        : sortBy === "prix"
        ? { meilleurPrix: 1, prix: 1 }
        : { popularite: -1 };

    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Parfum.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate(POPULATE_NOTES),
      Parfum.countDocuments(query),
    ]);

    res.json({
      parfums: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("❌ Erreur getParfums:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ========================================================================
   GET /api/parfums/search - recherche spécialisée (q, notes, genre, marque)
   ======================================================================== */
export const searchParfums = async (req, res) => {
  try {
    const { q, notes, genre, marque } = req.query;
    if (!q || q.trim().length < 2) {
      return res
        .status(400)
        .json({
          message: "Le terme de recherche doit contenir au moins 2 caractères",
        });
    }

    const r = new RegExp(q.trim(), "i");
    const or = [{ nom: r }, { marque: r }, { description: r }];

    const matchedNotes = await parseNotesToIds([
      q,
      ...(notes ? notes.split(",") : []),
    ]);
    if (matchedNotes.length) {
      or.push({ notes_tete: { $in: matchedNotes } });
      or.push({ notes_coeur: { $in: matchedNotes } });
      or.push({ notes_fond: { $in: matchedNotes } });
    }

    const query = { $or: or };
    if (genre && ["homme", "femme", "mixte"].includes(genre))
      query.genre = genre;
    if (marque) query.marque = { $regex: marque, $options: "i" };

    const parfums = await Parfum.find(query)
      .sort({ popularite: -1 })
      .limit(20)
      .populate(POPULATE_NOTES);

    res.json(parfums);
  } catch (error) {
    console.error("❌ Erreur searchParfums:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ========================================================================
   GET /api/parfums/:id - détail + incrément popularité
   ======================================================================== */
export const getParfumById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    const parfum = await Parfum.findById(id).populate(POPULATE_NOTES).lean();
    if (!parfum) return res.status(404).json({ message: "Parfum non trouvé" });

    // Incrémenter popularité en arrière-plan
    Parfum.findByIdAndUpdate(id, { $inc: { popularite: 1 } }).catch(() => {});

    res.json(parfum);
  } catch (error) {
    console.error("Erreur getParfumById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ========================================================================
   POST /api/parfums/similarity - similarité basée sur plusieurs parfums
   Body: { parfumIds: [], limit? }
   ======================================================================== */
export const getParfumsBySimilarity = async (req, res) => {
  try {
    const { parfumIds, limit = 10 } = req.body;
    if (!Array.isArray(parfumIds) || parfumIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Un tableau d'IDs de parfums est requis" });
    }

    const validIds = parfumIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
    if (!validIds.length)
      return res.status(400).json({ message: "Aucun ID valide fourni" });

    const referenceParfums = await Parfum.find({
      _id: { $in: validIds },
    }).select("notes_tete notes_coeur notes_fond");
    if (!referenceParfums.length)
      return res.status(404).json({ message: "Aucun parfum trouvé" });

    const allNoteIds = [
      ...new Set(
        referenceParfums.flatMap((p) => collectAllNotesIdsFromParfum(p))
      ),
    ];

    if (!allNoteIds.length) {
      return res.json({
        sourceParfums: referenceParfums.length,
        foundSimilar: 0,
        parfums: [],
      });
    }

    const similarQuery = {
      _id: { $nin: validIds },
      ...buildNotesFilter(
        allNoteIds.map((id) => new mongoose.Types.ObjectId(id))
      ),
    };

    const similar = await Parfum.find(similarQuery)
      .populate(POPULATE_NOTES)
      .sort({ popularite: -1 });

    const withScore = similar
      .map((p) => {
        const ids = collectAllNotesIdsFromParfum(p);
        const commons = ids.filter((id) => allNoteIds.includes(id));
        return {
          ...p.toObject(),
          similarityScore: commons.length,
          similarityPercentage: Math.round(
            (commons.length / allNoteIds.length) * 100
          ),
          commonNotesCount: commons.length,
        };
      })
      .filter((p) => p.similarityScore > 0)
      .sort(
        (a, b) =>
          b.similarityScore - a.similarityScore || b.popularite - a.popularite
      )
      .slice(0, Math.min(parseInt(limit, 10) || 10, 50));

    res.json({
      sourceParfums: referenceParfums.length,
      foundSimilar: withScore.length,
      totalNotesAnalyzed: allNoteIds.length,
      parfums: withScore,
    });
  } catch (error) {
    console.error("Erreur getParfumsBySimilarity:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ========================================================================
   GET /api/parfums/:id/similar - similaires à un parfum
   ======================================================================== */
export const getSimilarParfums = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    const parfum = await Parfum.findById(id).select(
      "notes_tete notes_coeur notes_fond"
    );
    if (!parfum) return res.status(404).json({ message: "Parfum non trouvé" });

    const allNoteIds = collectAllNotesIdsFromParfum(parfum).map(
      (x) => new mongoose.Types.ObjectId(x)
    );
    if (!allNoteIds.length) return res.json([]);

    const query = {
      _id: { $ne: id },
      ...buildNotesFilter(allNoteIds),
    };

    const similaires = await Parfum.find(query)
      .populate(POPULATE_NOTES)
      .sort({ popularite: -1 })
      .limit(6);

    res.json(similaires);
  } catch (error) {
    console.error("Erreur getSimilarParfums:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ========================================================================
   GET /api/parfums/by-note/:noteId - parfums contenant une note
   ======================================================================== */
export const getParfumsByNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ message: "ID de note invalide" });
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const filter = buildNotesFilter([new mongoose.Types.ObjectId(noteId)]);

    const [items, total] = await Promise.all([
      Parfum.find(filter)
        .populate(POPULATE_NOTES)
        .sort({ popularite: -1 })
        .skip(skip)
        .limit(limitNum),
      Parfum.countDocuments(filter),
    ]);

    res.json({
      parfums: items,
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

/* ========================================================================
   Endpoint de test/diagnostic rapide
   ======================================================================== */
export const testSearchData = async (req, res) => {
  try {
    const parfumsCount = await Parfum.countDocuments();
    const notesCount = await NoteOlfactive.countDocuments();

    const parfumsAvecNotes = await Parfum.countDocuments({
      $or: [
        { notes_tete: { $exists: true, $ne: [] } },
        { notes_coeur: { $exists: true, $ne: [] } },
        { notes_fond: { $exists: true, $ne: [] } },
      ],
    });

    const jasminNote = await NoteOlfactive.findOne({ nom: /jasmin/i });
    let jasmin = { found: false };
    if (jasminNote) {
      const totalAvecJasmin = await Parfum.countDocuments({
        $or: [
          { notes_tete: jasminNote._id },
          { notes_coeur: jasminNote._id },
          { notes_fond: jasminNote._id },
        ],
      });
      jasmin = {
        found: true,
        noteName: jasminNote.nom,
        parfumsCount: totalAvecJasmin,
      };
    }

    const sample = await Parfum.find({
      $or: [
        { notes_tete: { $exists: true, $ne: [] } },
        { notes_coeur: { $exists: true, $ne: [] } },
        { notes_fond: { $exists: true, $ne: [] } },
      ],
    })
      .populate(POPULATE_NOTES)
      .limit(5)
      .lean();

    res.json({
      stats: {
        parfumsTotal: parfumsCount,
        notesTotal: notesCount,
        parfumsAvecNotes,
        pourcentageAvecNotes: Math.round(
          (parfumsAvecNotes / Math.max(1, parfumsCount)) * 100
        ),
      },
      jasminTest: jasmin,
      sampleParfums: sample.map((p) => ({
        nom: p.nom,
        marque: p.marque,
        notes_tete: (p.notes_tete || []).map((n) => `${n.nom} (${n.type})`),
        notes_coeur: (p.notes_coeur || []).map((n) => `${n.nom} (${n.type})`),
        notes_fond: (p.notes_fond || []).map((n) => `${n.nom} (${n.type})`),
      })),
    });
  } catch (error) {
    console.error("❌ Erreur test:", error);
    res.status(500).json({ error: error.message });
  }
};

/* =========================
   CRUD + EXPORT/IMPORT CSV
   ========================= */

export const createParfum = async (req, res) => {
  try {
    const {
      nom,
      marque,
      genre,
      description,
      notes_tete = [],
      notes_coeur = [],
      notes_fond = [],
      liensMarchands,
      codeBarres,
      prix,
    } = req.body;

    // Validation des notes (si envoyées)
    for (const arr of [notes_tete, notes_coeur, notes_fond]) {
      const v = await validateNotesExist(arr);
      if (!v.ok) {
        return res
          .status(400)
          .json({ message: "IDs de notes invalides", invalid: v.invalid });
      }
    }

    const parfum = new Parfum({
      nom,
      marque,
      genre,
      description,
      notes_tete,
      notes_coeur,
      notes_fond,
      liensMarchands: liensMarchands || [],
      codeBarres,
      prix,
      photo: req.file ? req.file.path : null,
    });

    await parfum.save();
    await parfum.populate(POPULATE_NOTES);

    res.status(201).json(parfum);
  } catch (error) {
    console.error("Erreur createParfum:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const updateParfum = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de parfum invalide" });
    }

    // Validation si les tableaux de notes sont présents
    for (const key of ["notes_tete", "notes_coeur", "notes_fond"]) {
      if (Array.isArray(updateData[key])) {
        const v = await validateNotesExist(updateData[key]);
        if (!v.ok) {
          return res
            .status(400)
            .json({ message: `IDs invalides pour ${key}`, invalid: v.invalid });
        }
      }
    }

    if (req.file) updateData.photo = req.file.path;

    const parfum = await Parfum.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate(POPULATE_NOTES);

    if (!parfum) return res.status(404).json({ message: "Parfum non trouvé" });

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
    if (!parfum) return res.status(404).json({ message: "Parfum non trouvé" });

    res.json({ message: "Parfum supprimé avec succès" });
  } catch (error) {
    console.error("Erreur deleteParfum:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

export const exportParfumsCSV = async (req, res) => {
  try {
    // On exporte avec les noms de notes
    const parfums = await Parfum.find().populate(POPULATE_NOTES).lean();

    const csv = await csvService.exportParfums(
      parfums.map((p) => ({
        ...p,
        notes_tete: (p.notes_tete || []).map((n) => n.nom),
        notes_coeur: (p.notes_coeur || []).map((n) => n.nom),
        notes_fond: (p.notes_fond || []).map((n) => n.nom),
      }))
    );

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
    if (!req.file)
      return res.status(400).json({ message: "Fichier CSV requis" });

    const result = await csvService.importParfums(req.file.path);

    // Nettoyage du fichier temporaire
    const fs = await import("fs");
    fs.unlinkSync(req.file.path);

    res.json({ message: "Import terminé", ...result });
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

    res.json({ totalParfums, parGenre, parMarque, plusPopulaires });
  } catch (error) {
    console.error("Erreur getParfumsStats:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
