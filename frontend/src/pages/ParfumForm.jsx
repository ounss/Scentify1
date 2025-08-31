// frontend/src/pages/ParfumForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  Heart,
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
  const location = useLocation();
  const { id } = useParams();
  const { isAuthenticated, isAdmin } = useAuth();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    nom: "",
    marque: "",
    genre: "",
    description: "",
    imageUrl: "",
    anneSortie: new Date().getFullYear(),
    concentre: "EDT",
    prix: "",
    popularite: 0,
    longevite: "",
    sillage: "",
    notes: {
      tete: [],
      coeur: [],
      fond: [],
    },
    liensMarchands: [],
  });

  const [allNotes, setAllNotes] = useState({
    tete: [],
    coeur: [],
    fond: [],
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [newMerchantLink, setNewMerchantLink] = useState({
    nom: "",
    url: "",
    prix: "",
  });
  const [showMerchantForm, setShowMerchantForm] = useState(false);

  // Charger les données lors de l'édition
  useEffect(() => {
    if (isEdit && id) {
      loadParfumData();
    }
  }, [isEdit, id]);

  // Charger les notes disponibles
  useEffect(() => {
    loadNotes();
  }, []);

  const loadParfumData = async () => {
    try {
      setLoadingData(true);
      const response = await parfumAPI.getById(id);
      const parfum = response.data;

      setFormData({
        nom: parfum.nom || "",
        marque: parfum.marque || "",
        genre: parfum.genre || "",
        description: parfum.description || "",
        imageUrl: parfum.imageUrl || "",
        anneSortie: parfum.anneSortie || new Date().getFullYear(),
        concentre: parfum.concentre || "EDT",
        prix: parfum.prix || "",
        popularite: parfum.popularite || 0,
        longevite: parfum.longevite || "",
        sillage: parfum.sillage || "",
        notes: {
          tete:
            parfum.notes?.filter((n) => n.type === "tete").map((n) => n._id) ||
            [],
          coeur:
            parfum.notes?.filter((n) => n.type === "coeur").map((n) => n._id) ||
            [],
          fond:
            parfum.notes?.filter((n) => n.type === "fond").map((n) => n._id) ||
            [],
        },
        liensMarchands: parfum.liensMarchands || [],
      });
    } catch (error) {
      console.error("Erreur chargement parfum:", error);
      toast.error("Erreur lors du chargement du parfum");
      navigate("/");
    } finally {
      setLoadingData(false);
    }
  };

  const loadNotes = async () => {
    try {
      const types = ["tete", "coeur", "fond"];
      const notesData = {};

      for (const type of types) {
        try {
          const response = await noteAPI.getByType(type);
          notesData[type] = response.data || [];
        } catch (error) {
          console.warn(`Erreur chargement notes ${type}:`, error);
          notesData[type] = [];
        }
      }

      setAllNotes(notesData);
    } catch (error) {
      console.error("Erreur chargement notes:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNoteToggle = (type, noteId) => {
    setFormData((prev) => {
      const currentNotes = prev.notes[type];
      const isSelected = currentNotes.includes(noteId);

      return {
        ...prev,
        notes: {
          ...prev.notes,
          [type]: isSelected
            ? currentNotes.filter((id) => id !== noteId)
            : [...currentNotes, noteId],
        },
      };
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Vous devez être connecté");
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      // Combiner toutes les notes
      const allSelectedNotes = [
        ...formData.notes.tete,
        ...formData.notes.coeur,
        ...formData.notes.fond,
      ];

      const parfumData = {
        nom: formData.nom,
        marque: formData.marque,
        genre: formData.genre,
        description: formData.description,
        imageUrl: formData.imageUrl,
        anneSortie: parseInt(formData.anneSortie),
        concentre: formData.concentre,
        prix: parseFloat(formData.prix) || null,
        notes: allSelectedNotes,
        liensMarchands: formData.liensMarchands,
        longevite: formData.longevite,
        sillage: formData.sillage,
        // Seuls les admins peuvent modifier la popularité
        ...(isAdmin && { popularite: parseInt(formData.popularite) }),
      };

      if (isEdit) {
        await parfumAPI.update(id, parfumData);
        toast.success("Parfum modifié avec succès !");
      } else {
        await parfumAPI.create(parfumData);
        toast.success("Parfum créé avec succès !");
      }

      navigate(`/parfum/${id || "nouveau"}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Erreur lors de la ${isEdit ? "modification" : "création"}`
      );
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

          {formData.imageUrl ? (
            <div className={styles.imagePreview}>
              <img
                src={formData.imageUrl}
                alt="Aperçu parfum"
                className={styles.previewImage}
              />
              <button
                type="button"
                onClick={() => handleInputChange("imageUrl", "")}
                className={styles.removeImageButton}
              >
                <X className={styles.icon} />
              </button>
            </div>
          ) : (
            <div className={styles.imagePlaceholder}>
              <Camera className={styles.placeholderIcon} />
              <span className={styles.placeholderText}>Ajouter une photo</span>
            </div>
          )}

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
        </section>

        {/* Section Informations de base */}
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
                <option value="">Sélectionner</option>
                {genres.map((genre) => (
                  <option key={genre.value} value={genre.value}>
                    {genre.label}
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
                  onChange={(e) =>
                    handleInputChange("anneSortie", e.target.value)
                  }
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
                {concentres.map((concentre) => (
                  <option key={concentre.value} value={concentre.value}>
                    {concentre.label}
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

        {/* Section Performance */}
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
                {longeviteOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
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
                {sillageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Popularité (admin seulement) */}
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
        </section>

        {/* Section Notes olfactives */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notes olfactives</h2>

          {Object.entries(allNotes).map(([type, notes]) => (
            <div key={type} className={styles.notesGroup}>
              <h3
                className={`${styles.notesTitle} ${
                  styles[`notes${type.charAt(0).toUpperCase() + type.slice(1)}`]
                }`}
              >
                <Star className={styles.notesIcon} />
                Notes de {type === "tete" ? "tête" : type}
              </h3>

              <div className={styles.notesGrid}>
                {notes.map((note) => (
                  <button
                    key={note._id}
                    type="button"
                    onClick={() => handleNoteToggle(type, note._id)}
                    className={`${styles.noteButton} ${
                      formData.notes[type].includes(note._id)
                        ? `${styles.noteSelected} ${
                            styles[
                              `note${
                                type.charAt(0).toUpperCase() + type.slice(1)
                              }Selected`
                            ]
                          }`
                        : styles.noteUnselected
                    }`}
                  >
                    {note.nom}
                  </button>
                ))}
              </div>

              {notes.length === 0 && (
                <p className={styles.noNotesText}>
                  Aucune note de {type} disponible
                </p>
              )}
            </div>
          ))}
        </section>

        {/* Section Liens marchands */}
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

          {/* Formulaire d'ajout de lien */}
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
        </section>

        {/* Bouton de soumission */}
        <div className={styles.submitSection}>
          <button
            type="submit"
            disabled={
              loading || !formData.nom || !formData.marque || !formData.genre
            }
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
