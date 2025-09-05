// frontend/src/pages/ParfumForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Search,
  Filter,
  X,
  Plus,
  Star,
  Clock,
  Droplets,
  Award,
  Calendar,
  Euro,
  Upload,
  Camera,
  Link as LinkIcon,
} from "lucide-react";
import { noteAPI, parfumAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import styles from "../styles/ParfumForm.module.css";

export default function ParfumForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated, isAdmin } = useAuth();
  const isEdit = Boolean(id);

  // État du formulaire
  const [formData, setFormData] = useState({
    nom: "",
    marque: "",
    genre: "mixte",
    description: "",
    notes_tete: [],
    notes_coeur: [],
    notes_fond: [],
    prix: "",
    imageUrl: "",
    anneSortie: new Date().getFullYear(),
    concentre: "EDT",
    popularite: 0,
    longevite: "",
    sillage: "",
    liensMarchands: [],
  });

  // Notes & filtres
  const [allNotes, setAllNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("tous");
  const [families, setFamilies] = useState([]);

  // UI
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);

  // Image
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadMode, setUploadMode] = useState("upload"); // "upload" | "url"

  // Liens marchands
  const [newMerchantLink, setNewMerchantLink] = useState({
    nom: "",
    url: "",
    prix: "",
  });
  const [showMerchantForm, setShowMerchantForm] = useState(false);

  // Chargement initial
  useEffect(() => {
    if (isEdit && id) loadParfumData();
    loadNotesAndFamilies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id]);

  // Filtrage des notes
  useEffect(() => {
    filterNotes();
  }, [allNotes, searchTerm, selectedFamily]);

  const loadParfumData = async () => {
    try {
      setLoadingData(true);
      const { data: parfum } = await parfumAPI.getById(id);

      setFormData({
        nom: parfum.nom || "",
        marque: parfum.marque || "",
        genre: parfum.genre || "mixte",
        description: parfum.description || "",
        imageUrl: parfum.photo || parfum.imageUrl || "",
        anneSortie: parfum.anneSortie || new Date().getFullYear(),
        concentre: parfum.concentre || "EDT",
        prix: parfum.prix ?? "",
        popularite: parfum.popularite || 0,
        longevite: parfum.longevite || "",
        sillage: parfum.sillage || "",
        notes_tete: (parfum.notes_tete || []).map((n) => n._id || n),
        notes_coeur: (parfum.notes_coeur || []).map((n) => n._id || n),
        notes_fond: (parfum.notes_fond || []).map((n) => n._id || n),
        liensMarchands: parfum.liensMarchands || [],
      });
      setImagePreview("");
    } catch (error) {
      console.error("Erreur chargement parfum:", error);
      toast.error("Erreur lors du chargement du parfum");
      navigate("/admin");
    } finally {
      setLoadingData(false);
    }
  };

  // Dans ParfumForm.jsx, remplacez UNIQUEMENT cette fonction :

  const loadNotesAndFamilies = async () => {
    try {
      console.log("🔍 Chargement des notes et familles...");

      // ✅ CORRIGÉ: Utilise noteAPI.getAll() au lieu de getNotesWithSuggestions()
      const notesResp = await noteAPI.getAll();
      console.log("🔍 Réponse API notes:", notesResp);

      // ✅ CORRIGÉ: Gestion flexible de la structure de réponse
      const notes = notesResp.data?.notes || notesResp.data || [];
      setAllNotes(notes);

      console.log(`✅ ${notes.length} notes chargées:`, notes.slice(0, 3));

      // ✅ Extraire les familles uniques des notes chargées
      if (notes.length > 0) {
        const uniqueFamilies = [
          ...new Set(notes.map((note) => note.famille)),
        ].filter(Boolean);
        const familiesWithCount = uniqueFamilies.map((famille) => ({
          famille,
          count: notes.filter((note) => note.famille === famille).length,
        }));
        setFamilies(familiesWithCount);

        console.log(
          `✅ ${familiesWithCount.length} familles extraites:`,
          familiesWithCount
        );
      } else {
        console.log("⚠️ Aucune note trouvée");
        setFamilies([]);
      }
    } catch (error) {
      console.error("❌ Erreur chargement notes:", error);
      console.error("❌ Détails erreur:", error.response?.data);

      // Toast informatif au lieu d'alarmant
      if (error.response?.status === 404) {
        toast.error("Aucune note disponible");
      } else {
        toast.error("Impossible de charger les notes olfactives");
      }

      setAllNotes([]);
      setFamilies([]);
    }
  };

  const filterNotes = () => {
    let filtered = allNotes;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.nom?.toLowerCase().includes(q) ||
          (note.synonymes || []).some((s) => s.toLowerCase().includes(q))
      );
    }
    if (selectedFamily !== "tous") {
      filtered = filtered.filter((note) => note.famille === selectedFamily);
    }
    setFilteredNotes(filtered);
  };

  // Helpers notes
  const removeNoteFromPosition = (position, noteId) => {
    const field = `notes_${position}`;
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((id) => id !== noteId),
    }));
  };

  const addNoteToPosition = (position, noteId) => {
    const field = `notes_${position}`;
    setFormData((prev) => {
      const current = prev[field] || [];
      if (current.includes(noteId)) return prev;
      return { ...prev, [field]: [...current, noteId] };
    });
  };

  // Autres handlers
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "imageUrl" && value) {
      removeUploadedImage();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
  };

  const removeUploadedImage = () => {
    setImageFile(null);
    setImagePreview("");
    const fileInput = document.getElementById("imageUpload");
    if (fileInput) fileInput.value = "";
  };

  const handleAddMerchantLink = () => {
    if (!newMerchantLink.nom || !newMerchantLink.url) {
      toast.error("Veuillez remplir au moins le nom et l'URL");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      liensMarchands: [...prev.liensMarchands, { ...newMerchantLink }],
    }));
    setNewMerchantLink({ nom: "", url: "", prix: "" });
    setShowMerchantForm(false);
  };

  const handleRemoveMerchantLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      liensMarchands: prev.liensMarchands.filter((_, i) => i !== index),
    }));
  };

  // Soumission
  // ✅ CORRECTION dans ParfumForm.jsx - fonction handleSubmit

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Vous devez être connecté");
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();

      // Champs simples
      const simpleFields = [
        "nom",
        "marque",
        "genre",
        "description",
        "anneeSortie", // ✅ CORRIGÉ: était "anneSortie"
        "concentre",
        "prix",
        "longevite",
        "sillage",
      ];

      simpleFields.forEach((key) => {
        const value = formData[key];
        if (value !== "" && value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });

      // ✅ CORRECTION PRINCIPALE : Notes par position
      // Problème: Les arrays étaient mal formatés pour FormData
      ["notes_tete", "notes_coeur", "notes_fond"].forEach((key) => {
        const notes = formData[key] || [];

        // ✅ SOLUTION 1: Filtrer les IDs valides uniquement
        const validNotes = notes.filter((id) => {
          // Vérifier que c'est un string et qu'il ressemble à un ObjectId
          if (typeof id !== "string" || id.length !== 24) {
            console.warn(`⚠️ ID note invalide ignoré: ${id}`);
            return false;
          }
          return true;
        });

        // ✅ SOLUTION 2: Ajouter chaque note individuellement à FormData
        validNotes.forEach((id, index) => {
          formDataToSend.append(`${key}[${index}]`, id);
        });

        // ✅ ALTERNATIVE: Envoyer comme array JSON si le backend le supporte
        // formDataToSend.append(key, JSON.stringify(validNotes));
      });

      // Liens marchands
      (formData.liensMarchands || []).forEach((link, idx) => {
        formDataToSend.append(`liensMarchands[${idx}][nom]`, link.nom || "");
        formDataToSend.append(`liensMarchands[${idx}][url]`, link.url || "");
        if (link.prix !== undefined && link.prix !== "") {
          formDataToSend.append(`liensMarchands[${idx}][prix]`, link.prix);
        }
      });

      // Image
      if (imageFile) {
        formDataToSend.append("photo", imageFile);
      } else if (formData.imageUrl) {
        formDataToSend.append("imageUrl", formData.imageUrl);
      }

      // Popularité (admin uniquement)
      if (isAdmin && formData.popularite !== undefined) {
        formDataToSend.append("popularite", formData.popularite);
      }

      // ✅ DEBUG: Afficher ce qui est envoyé
      console.log("🔍 FormData envoyée:");
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      if (isEdit) {
        await parfumAPI.update(id, formDataToSend);
        toast.success("Parfum modifié avec succès !");
      } else {
        await parfumAPI.create(formDataToSend);
        toast.success("Parfum ajouté avec succès !");
      }

      navigate("/admin");
    } catch (error) {
      console.error("Submit ParfumForm:", error);

      // ✅ AMÉLIORATION: Afficher l'erreur détaillée
      if (error?.response?.data?.errors) {
        console.error("❌ Erreurs de validation:", error.response.data.errors);
        error.response.data.errors.forEach((err) => {
          toast.error(`${err.field}: ${err.message}`);
        });
      } else {
        toast.error(
          error?.response?.data?.message ||
            `Erreur lors de la ${isEdit ? "modification" : "création"}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const genres = [
    { value: "femme", label: "Femme" },
    { value: "homme", label: "Homme" },
    { value: "mixte", label: "Mixte" },
  ];

  const concentres = [
    { value: "EDT", label: "Eau de Toilette" },
    { value: "EDP", label: "Eau de Parfum" },
    { value: "EDC", label: "Eau de Cologne" },
    { value: "Parfum", label: "Parfum" },
    { value: "Autre", label: "Autre" },
  ];

  const longeviteOptions = [
    "Très faible (< 2h)",
    "Faible (2-4h)",
    "Modérée (4-6h)",
    "Bonne (6-8h)",
    "Très bonne (8-12h)",
    "Excellente (> 12h)",
  ];

  const sillageOptions = ["Intimiste", "Proche", "Modéré", "Fort", "Très fort"];

  if (loadingData) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Chargement du parfum...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            <ArrowLeft className={styles.icon} />
            Retour
          </button>
          <h1 className={styles.title}>
            {isEdit ? "Modifier" : "Nouveau parfum"}
          </h1>
          <div className={styles.spacer} />
        </div>
      </header>

      {/* Form */}
      <form id="parfum-form" onSubmit={handleSubmit} className={styles.form}>
        {/* Image */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Camera className={styles.icon} />
            Image du parfum
          </h2>

          {imagePreview || formData.imageUrl ? (
            <div className={styles.imagePreview}>
              <img
                src={imagePreview || formData.imageUrl}
                alt="Aperçu parfum"
                className={styles.previewImage}
              />
              <button
                type="button"
                onClick={
                  imagePreview
                    ? removeUploadedImage
                    : () => handleInputChange("imageUrl", "")
                }
                className={styles.removeImageButton}
              >
                <X className={styles.icon} />
              </button>
            </div>
          ) : (
            <div className={styles.imagePlaceholder}>
              <Camera className={styles.placeholderIcon} />
              <div className={styles.placeholderText}>Aucune image</div>
            </div>
          )}

          <div className={styles.formRow}>
            <button
              type="button"
              onClick={() => setUploadMode("upload")}
              className={`${styles.input} ${
                uploadMode === "upload" ? styles.noteSelected : ""
              }`}
            >
              <Upload className={styles.icon} />
              Upload fichier
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("url")}
              className={`${styles.input} ${
                uploadMode === "url" ? styles.noteSelected : ""
              }`}
            >
              <LinkIcon className={styles.icon} />
              URL externe
            </button>
          </div>

          {uploadMode === "upload" && (
            <div className={styles.formGroup}>
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.input}
              />
            </div>
          )}

          {uploadMode === "url" && (
            <div className={styles.formGroup}>
              <label className={styles.label}>URL de l'image</label>
              <div className={styles.inputWithIcon}>
                <LinkIcon className={styles.inputIcon} />
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    handleInputChange("imageUrl", e.target.value)
                  }
                  className={styles.input}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Infos de base */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Informations de base</h2>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Nom du parfum <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => handleInputChange("nom", e.target.value)}
              className={styles.input}
              placeholder="Ex: Sauvage"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Marque <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.marque}
              onChange={(e) => handleInputChange("marque", e.target.value)}
              className={styles.input}
              placeholder="Ex: Dior"
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Genre <span className={styles.required}>*</span>
              </label>
              <select
                value={formData.genre}
                onChange={(e) => handleInputChange("genre", e.target.value)}
                className={styles.select}
                required
              >
                {genres.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Calendar className={styles.labelIcon} />
                Année de sortie
              </label>
              <input
                type="number"
                value={formData.anneSortie}
                onChange={(e) =>
                  handleInputChange("anneSortie", e.target.value)
                }
                className={styles.input}
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Concentration</label>
              <select
                value={formData.concentre}
                onChange={(e) => handleInputChange("concentre", e.target.value)}
                className={styles.select}
              >
                {concentres.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Euro className={styles.labelIcon} />
                Prix (€)
              </label>
              <input
                type="number"
                value={formData.prix}
                onChange={(e) => handleInputChange("prix", e.target.value)}
                className={styles.input}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={styles.textarea}
              placeholder="Décrivez ce parfum..."
            />
          </div>
        </div>

        {/* Performance */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Performance</h2>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Clock className={styles.labelIcon} />
                Longévité
              </label>
              <select
                value={formData.longevite}
                onChange={(e) => handleInputChange("longevite", e.target.value)}
                className={styles.select}
              >
                <option value="">Sélectionner</option>
                {longeviteOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Droplets className={styles.labelIcon} />
                Sillage
              </label>
              <select
                value={formData.sillage}
                onChange={(e) => handleInputChange("sillage", e.target.value)}
                className={styles.select}
              >
                <option value="">Sélectionner</option>
                {sillageOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isAdmin && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <Award className={styles.labelIcon} />
                Popularité (0-100)
              </label>
              <div className={styles.rangeGroup}>
                <input
                  type="range"
                  value={formData.popularite}
                  onChange={(e) =>
                    handleInputChange("popularite", e.target.value)
                  }
                  className={styles.range}
                  min="0"
                  max="100"
                />
                <span className={styles.rangeValue}>{formData.popularite}</span>
              </div>
            </div>
          )}
        </div>

        {/* Notes olfactives */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Notes olfactives</h2>

          {/* Filtres */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <div className={styles.inputWithIcon}>
                <Search className={styles.inputIcon} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.input}
                  placeholder="Rechercher une note..."
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.inputWithIcon}>
                <Filter className={styles.inputIcon} />
                <select
                  value={selectedFamily}
                  onChange={(e) => setSelectedFamily(e.target.value)}
                  className={styles.select}
                >
                  <option value="tous">Toutes les familles</option>
                  {families.map((family) => (
                    <option key={family.famille} value={family.famille}>
                      {family.famille} ({family.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Mode filtré */}
          {searchTerm || selectedFamily !== "tous" ? (
            <div className={styles.notesGroup}>
              <h3 className={styles.notesTitle}>
                <Search className={styles.notesIcon} />
                Notes disponibles ({filteredNotes.length})
              </h3>
              {filteredNotes.length === 0 ? (
                <div className={styles.noNotesText}>Aucune note trouvée</div>
              ) : (
                <div className={styles.notesGrid}>
                  {filteredNotes.map((note) => {
                    const isInTete = formData.notes_tete.includes(note._id);
                    const isInCoeur = formData.notes_coeur.includes(note._id);
                    const isInFond = formData.notes_fond.includes(note._id);
                    const isSelected = isInTete || isInCoeur || isInFond;

                    return (
                      <button
                        key={note._id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (isInTete)
                              removeNoteFromPosition("tete", note._id);
                            if (isInCoeur)
                              removeNoteFromPosition("coeur", note._id);
                            if (isInFond)
                              removeNoteFromPosition("fond", note._id);
                          } else {
                            addNoteToPosition("tete", note._id);
                          }
                        }}
                        className={`${styles.noteButton} ${
                          isSelected
                            ? styles.noteTeteSelected
                            : styles.noteUnselected
                        }`}
                      >
                        {note.nom}
                        {isSelected && (
                          <span style={{ marginLeft: 4, fontSize: 10 }}>
                            ({isInTete ? "T" : isInCoeur ? "C" : "F"})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // Mode normal : par positions
            <>
              {/* Tête */}
              <div className={styles.notesGroup}>
                <h3 className={`${styles.notesTitle} ${styles.notesTete}`}>
                  <Star className={styles.notesIcon} />
                  Notes de tête ({formData.notes_tete.length})
                </h3>
                <div className={styles.notesGrid}>
                  {allNotes.map((note) => {
                    const isSelected = formData.notes_tete.includes(note._id);
                    return (
                      <button
                        key={note._id}
                        type="button"
                        onClick={() =>
                          isSelected
                            ? removeNoteFromPosition("tete", note._id)
                            : addNoteToPosition("tete", note._id)
                        }
                        className={`${styles.noteButton} ${
                          isSelected
                            ? styles.noteTeteSelected
                            : styles.noteUnselected
                        }`}
                      >
                        {note.nom}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cœur */}
              <div className={styles.notesGroup}>
                <h3 className={`${styles.notesTitle} ${styles.notesCoeur}`}>
                  <Star className={styles.notesIcon} />
                  Notes de cœur ({formData.notes_coeur.length})
                </h3>
                <div className={styles.notesGrid}>
                  {allNotes.map((note) => {
                    const isSelected = formData.notes_coeur.includes(note._id);
                    return (
                      <button
                        key={note._id}
                        type="button"
                        onClick={() =>
                          isSelected
                            ? removeNoteFromPosition("coeur", note._id)
                            : addNoteToPosition("coeur", note._id)
                        }
                        className={`${styles.noteButton} ${
                          isSelected
                            ? styles.noteCoeurSelected
                            : styles.noteUnselected
                        }`}
                      >
                        {note.nom}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fond */}
              <div className={styles.notesGroup}>
                <h3 className={`${styles.notesTitle} ${styles.notesFond}`}>
                  <Star className={styles.notesIcon} />
                  Notes de fond ({formData.notes_fond.length})
                </h3>
                <div className={styles.notesGrid}>
                  {allNotes.map((note) => {
                    const isSelected = formData.notes_fond.includes(note._id);
                    return (
                      <button
                        key={note._id}
                        type="button"
                        onClick={() =>
                          isSelected
                            ? removeNoteFromPosition("fond", note._id)
                            : addNoteToPosition("fond", note._id)
                        }
                        className={`${styles.noteButton} ${
                          isSelected
                            ? styles.noteFondSelected
                            : styles.noteUnselected
                        }`}
                      >
                        {note.nom}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Aide */}
          <div
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 14,
              color: "#64748b",
            }}
          >
            💡 <strong>Astuce :</strong> Cliquez sur une note pour l'ajouter ou
            la retirer. Utilisez les filtres pour trouver rapidement.
          </div>
        </div>

        {/* Liens marchands */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Liens marchands</h2>
            <button
              type="button"
              onClick={() => setShowMerchantForm(true)}
              className={styles.addButton}
            >
              <Plus className={styles.icon} />
              Ajouter
            </button>
          </div>

          {formData.liensMarchands.length > 0 ? (
            <div className={styles.merchantList}>
              {formData.liensMarchands.map((link, index) => (
                <div key={index} className={styles.merchantItem}>
                  <div className={styles.merchantInfo}>
                    <div className={styles.merchantName}>{link.nom}</div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.merchantUrl}
                    >
                      {link.url}
                    </a>
                    {link.prix && (
                      <div className={styles.merchantPrice}>{link.prix}€</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMerchantLink(index)}
                    className={styles.removeButton}
                  >
                    <X className={styles.icon} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noMerchantsText}>
              Aucun lien marchand ajouté
            </div>
          )}

          {showMerchantForm && (
            <div className={styles.merchantForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nom du marchand</label>
                <input
                  type="text"
                  value={newMerchantLink.nom}
                  onChange={(e) =>
                    setNewMerchantLink({
                      ...newMerchantLink,
                      nom: e.target.value,
                    })
                  }
                  className={styles.input}
                  placeholder="Ex: Sephora"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>URL</label>
                <input
                  type="url"
                  value={newMerchantLink.url}
                  onChange={(e) =>
                    setNewMerchantLink({
                      ...newMerchantLink,
                      url: e.target.value,
                    })
                  }
                  className={styles.input}
                  placeholder="https://..."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Prix (€)</label>
                <input
                  type="number"
                  value={newMerchantLink.prix}
                  onChange={(e) =>
                    setNewMerchantLink({
                      ...newMerchantLink,
                      prix: e.target.value,
                    })
                  }
                  className={styles.input}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setShowMerchantForm(false)}
                  className={styles.cancelButton}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAddMerchantLink}
                  className={styles.addMerchantButton}
                >
                  <Plus className={styles.icon} />
                  Ajouter
                </button>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Submit Section - fixe bas de page */}
      <div className={styles.submitSection}>
        <button
          type="submit"
          form="parfum-form"
          disabled={
            loading || !formData.nom || !formData.marque || !formData.genre
          }
          className={styles.submitButton}
          onClick={handleSubmit}
        >
          {loading ? (
            <div className={styles.loadingSubmit}>
              <div className={styles.spinner} />
              {isEdit ? "Modification..." : "Création..."}
            </div>
          ) : (
            <>
              <Save className={styles.icon} />
              {isEdit ? "Modifier le parfum" : "Créer le parfum"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
