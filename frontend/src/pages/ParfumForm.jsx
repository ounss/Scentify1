// frontend/src/pages/ParfumForm.jsx - VERSION CORRIGÉE
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  Plus,
  X,
  Save,
  Upload,
  Link as LinkIcon,
  Star,
  Clock,
  Droplets,
  Award,
  Calendar,
  Euro,
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

  // Structure de données corrigée pour correspondre au backend
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

  const [allNotes, setAllNotes] = useState({
    tete: [],
    coeur: [],
    fond: [],
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  
  // Gestion des liens marchands
  const [newMerchantLink, setNewMerchantLink] = useState({
    nom: "",
    url: "",
    prix: "",
  });
  const [showMerchantForm, setShowMerchantForm] = useState(false);

  // Gestion des images
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadMode, setUploadMode] = useState("upload");

  // Chargement des données pour l'édition
  useEffect(() => {
    if (isEdit && id) {
      loadParfumData();
    }
  }, [isEdit, id]);

  // Chargement des notes disponibles
  useEffect(() => {
    loadNotes();
  }, []);

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
        // Structure backend avec trois champs séparés
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

  const loadNotes = async () => {
    console.log("🔍 Début chargement des notes...");
    try {
      const types = ["tête", "cœur", "fond"];
      const notesData = {};

      for (const type of types) {
        console.log(`📝 Chargement notes de type: ${type}`);
        
        try {
          // Utilisation de la méthode getByType (désormais ajoutée à l'API)
          const resp = await noteAPI.getByType(type);
          console.log(`✅ Réponse pour ${type}:`, resp.data);

          const key = type === "tête" ? "tete" : type === "cœur" ? "coeur" : "fond";
          notesData[key] = resp.data || [];
          
          console.log(`💾 Stocké ${notesData[key].length} notes pour "${key}"`);
        } catch (error) {
          console.warn(`⚠️ Erreur pour le type ${type}:`, error);
          
          // Fallback si getByType échoue pour un type spécifique
          const key = type === "tête" ? "tete" : type === "cœur" ? "coeur" : "fond";
          notesData[key] = [];
        }
      }

      console.log("📊 Notes finales:", notesData);
      setAllNotes(notesData);
      
    } catch (error) {
      console.error("❌ Erreur chargement notes:", error);
      
      // Méthode alternative : récupérer toutes les notes et les grouper
      console.log("🔄 Tentative avec méthode alternative...");
      try {
        const resp = await noteAPI.getAll({ limit: 200 });
        const allNotesArray = resp.data.notes || resp.data || [];

        const notesData = {
          tete: allNotesArray.filter((note) => note.type === "tête"),
          coeur: allNotesArray.filter((note) => note.type === "cœur"),
          fond: allNotesArray.filter((note) => note.type === "fond"),
        };

        console.log("✅ Notes chargées via méthode alternative:", notesData);
        setAllNotes(notesData);
        
      } catch (fallbackError) {
        console.error("❌ Erreur méthode alternative:", fallbackError);
        setAllNotes({ tete: [], coeur: [], fond: [] });
        toast.error("Impossible de charger les notes olfactives");
      }
    }
  };

  // Handlers
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "imageUrl" && value) {
      removeUploadedImage();
    }
  };

  const handleNoteToggle = (type, noteId) => {
    const field = `notes_${type}`;
    setFormData((prev) => {
      const current = prev[field] || [];
      const exists = current.includes(noteId);
      const next = exists
        ? current.filter((id) => id !== noteId)
        : [...current, noteId];
      return { ...prev, [field]: next };
    });
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

  // Gestion images
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

  // Soumission du formulaire
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
        "nom", "marque", "genre", "description", 
        "anneSortie", "concentre", "prix", 
        "longevite", "sillage"
      ];
      
      simpleFields.forEach((key) => {
        const value = formData[key];
        if (value !== "" && value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });

      // Notes séparées par type
      ["notes_tete", "notes_coeur", "notes_fond"].forEach((key) => {
        (formData[key] || []).forEach((id) => {
          formDataToSend.append(key, id);
        });
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

      if (isEdit) {
        await parfumAPI.update(id, formDataToSend);
        toast.success("Parfum modifié avec succès !");
      } else {
        const response = await parfumAPI.create(formDataToSend);
        toast.success("Parfum ajouté avec succès !");
      }

      navigate("/admin");
    } catch (error) {
      console.error("Submit ParfumForm:", error);
      toast.error(
        error?.response?.data?.message ||
        `Erreur lors de la ${isEdit ? "modification" : "création"}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Constantes
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
    "Très faible (< 2h)", "Faible (2-4h)", "Modérée (4-6h)",
    "Bonne (6-8h)", "Très bonne (8-12h)", "Excellente (> 12h)",
  ];
  
  const sillageOptions = ["Intimiste", "Proche", "Modéré", "Fort", "Très fort"];

  if (loadingData) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
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
          </button>
          <h1 className={styles.title}>
            {isEdit ? "Modifier" : "Nouveau parfum"}
          </h1>
          <div className={styles.spacer}></div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Section Image */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Image du parfum</h2>

          {/* Toggle Upload/URL */}
          <div className={styles.uploadToggle}>
            <button
              type="button"
              onClick={() => setUploadMode("upload")}
              className={`${styles.toggleButton} ${uploadMode === "upload" ? styles.active : ""}`}
            >
              <Upload className={styles.icon} />
              Upload fichier
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("url")}
              className={`${styles.toggleButton} ${uploadMode === "url" ? styles.active : ""}`}
            >
              <LinkIcon className={styles.icon} />
              URL externe
            </button>
          </div>

          {/* Aperçu */}
          {(imagePreview || formData.imageUrl) && (
            <div className={styles.imagePreview}>
              <img
                src={imagePreview || formData.imageUrl}
                alt="Aperçu parfum"
                className={styles.previewImage}
              />
              <button
                type="button"
                onClick={imagePreview ? removeUploadedImage : () => handleInputChange("imageUrl", "")}
                className={styles.removeImageButton}
              >
                <X className={styles.icon} />
              </button>
            </div>
          )}

          {/* Upload */}
          {uploadMode === "upload" && (
            <div className={styles.uploadZone}>
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.fileInput}
              />
              <label htmlFor="imageUpload" className={styles.uploadLabel}>
                <Camera className={styles.placeholderIcon} />
                <span className={styles.placeholderText}>
                  {imageFile ? "Changer l'image" : "Choisir une image"}
                </span>
                <span className={styles.uploadHint}>
                  PNG, JPG, WEBP jusqu'à 5MB
                </span>
              </label>
            </div>
          )}

          {/* URL */}
          {uploadMode === "url" && (
            <div className={styles.formGroup}>
              <label className={styles.label}>URL de l'image</label>
              <div className={styles.inputWithIcon}>
                <LinkIcon className={styles.inputIcon} />
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                  className={styles.input}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          )}
        </section>

        {/* Informations de base */}
        <section className={styles.section}>
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
              <label className={styles.label}>Année de sortie</label>
              <div className={styles.inputWithIcon}>
                <Calendar className={styles.inputIcon} />
                <input
                  type="number"
                  value={formData.anneSortie}
                  onChange={(e) => handleInputChange("anneSortie", e.target.value)}
                  className={styles.input}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>
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
              <label className={styles.label}>Prix (€)</label>
              <div className={styles.inputWithIcon}>
                <Euro className={styles.inputIcon} />
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
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              className={styles.textarea}
              placeholder="Décrivez ce parfum..."
            />
          </div>
        </section>

        {/* Performance */}
        <section className={styles.section}>
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
                  onChange={(e) => handleInputChange("popularite", e.target.value)}
                  className={styles.range}
                  min="0"
                  max="100"
                />
                <span className={styles.rangeValue}>{formData.popularite}</span>
              </div>
            </div>
          )}
        </section>

        {/* Notes olfactives */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notes olfactives</h2>

          {[
            ["tete", "tête"],
            ["coeur", "cœur"], 
            ["fond", "fond"],
          ].map(([key, label]) => (
            <div key={key} className={styles.notesGroup}>
              <h3 className={`${styles.notesTitle} ${styles[`notes${key.charAt(0).toUpperCase() + key.slice(1)}`]}`}>
                <Star className={styles.notesIcon} />
                Notes de {label}
              </h3>

              <div className={styles.notesGrid}>
                {(allNotes[key] || []).map((note) => (
                  <button
                    key={note._id}
                    type="button"
                    onClick={() => handleNoteToggle(key, note._id)}
                    className={`${styles.noteButton} ${
                      (formData[`notes_${key}`] || []).includes(note._id)
                        ? `${styles.noteSelected} ${styles[`note${key.charAt(0).toUpperCase() + key.slice(1)}Selected`]}`
                        : styles.noteUnselected
                    }`}
                  >
                    {note.nom}
                  </button>
                ))}
              </div>

              {(allNotes[key] || []).length === 0 && (
                <p className={styles.noNotesText}>
                  Aucune note de {label} disponible
                </p>
              )}
            </div>
          ))}
        </section>

        {/* Liens marchands */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Liens marchands</h2>
            <button
              type="button"
              onClick={() => setShowMerchantForm(true)}
              className={styles.addButton}
            >
              <Plus className={styles.icon} />
            </button>
          </div>

          {formData.liensMarchands.length > 0 ? (
            <div className={styles.merchantList}>
              {formData.liensMarchands.map((link, index) => (
                <div key={index} className={styles.merchantItem}>
                  <div className={styles.merchantInfo}>
                    <h4 className={styles.merchantName}>{link.nom}</h4>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.merchantUrl}
                    >
                      {link.url}
                    </a>
                    {link.prix && (
                      <span className={styles.merchantPrice}>{link.prix}€</span>
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
            <p className={styles.noMerchantsText}>Aucun lien marchand ajouté</p>
          )}

          {showMerchantForm && (
            <div className={styles.merchantForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nom du marchand</label>
                <input
                  type="text"
                  value={newMerchantLink.nom}
                  onChange={(e) =>
                    setNewMerchantLink({ ...newMerchantLink, nom: e.target.value })
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
                    setNewMerchantLink({ ...newMerchantLink, url: e.target.value })
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
                    setNewMerchantLink({ ...newMerchantLink, prix: e.target.value })
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
        </section>

        {/* Submit */}
        <div className={styles.submitSection}>
          <button
            type="submit"
            disabled={loading || !formData.nom || !formData.marque || !formData.genre}
            className={styles.submitButton}
          >
            {loading ? (
              <div className={styles.loadingSubmit}>
                <div className={styles.spinner}></div>
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
      </form>
    </div>
  );
}