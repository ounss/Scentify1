// frontend/src/components/NoteForm.jsx - Formulaire mis à jour pour le nouveau système

import React, { useState, useEffect } from "react";
import { X, Save, Palette, Star, Info } from "lucide-react";
import { toast } from "react-hot-toast";
import styles from "../styles/NoteForm.module.css";

// Palette de couleurs par famille
const COULEURS_FAMILLES = {
  agrumes: "#f59e0b",
  florale: "#ec4899",
  fruitée: "#ef4444",
  verte: "#10b981",
  aromatique: "#8b5cf6",
  épicée: "#dc2626",
  boisée: "#92400e",
  orientale: "#7c2d12",
  ambrée: "#d97706",
  musquée: "#6b7280",
  animale: "#374151",
  poudrée: "#f472b6",
  gourmande: "#a855f7",
  marine: "#06b6d4",
  aldéhydée: "#e5e7eb",
  cuirée: "#451a03",
  fumée: "#6b7280",
  résineuse: "#365314",
};

const FAMILLES_OLFACTIVES = [
  "agrumes",
  "florale",
  "fruitée",
  "verte",
  "aromatique",
  "épicée",
  "boisée",
  "orientale",
  "ambrée",
  "musquée",
  "animale",
  "poudrée",
  "gourmande",
  "marine",
  "aldéhydée",
  "cuirée",
  "fumée",
  "résineuse",
];

const POSITIONS_DISPONIBLES = [
  {
    value: "tête",
    label: "Tête",
    description: "Notes de départ, premières à être perçues",
  },
  {
    value: "cœur",
    label: "Cœur",
    description: "Notes principales, cœur du parfum",
  },
  {
    value: "fond",
    label: "Fond",
    description: "Notes de base, dernières à perdurer",
  },
];

export default function NoteForm({
  note = null,
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    nom: "",
    famille: "",
    description: "",
    intensite: 5,
    popularite: 0,
    couleur: "#4a90e2",
    suggestedPositions: [],
    synonymes: [],
  });

  const [errors, setErrors] = useState({});
  const [synonymeInput, setSynonymeInput] = useState("");

  // Initialiser le formulaire
  useEffect(() => {
    if (note) {
      setFormData({
        nom: note.nom || "",
        famille: note.famille || "",
        description: note.description || "",
        intensite: note.intensite || 5,
        popularite: note.popularite || 0,
        couleur: note.couleur || COULEURS_FAMILLES[note.famille] || "#4a90e2",
        suggestedPositions:
          note.suggestedPositions || (note.type ? [note.type] : []), // Fallback ancien format
        synonymes: note.synonymes || [],
      });
    } else {
      // Réinitialiser pour nouvelle note
      setFormData({
        nom: "",
        famille: "",
        description: "",
        intensite: 5,
        popularite: 0,
        couleur: "#4a90e2",
        suggestedPositions: [],
        synonymes: [],
      });
    }
    setErrors({});
    setSynonymeInput("");
  }, [note, isOpen]);

  // Mettre à jour la couleur quand la famille change
  useEffect(() => {
    if (formData.famille && COULEURS_FAMILLES[formData.famille]) {
      setFormData((prev) => ({
        ...prev,
        couleur: COULEURS_FAMILLES[formData.famille],
      }));
    }
  }, [formData.famille]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const togglePosition = (position) => {
    setFormData((prev) => ({
      ...prev,
      suggestedPositions: prev.suggestedPositions.includes(position)
        ? prev.suggestedPositions.filter((p) => p !== position)
        : [...prev.suggestedPositions, position],
    }));
  };

  const addSynonyme = () => {
    const synonyme = synonymeInput.trim();
    if (synonyme && !formData.synonymes.includes(synonyme)) {
      setFormData((prev) => ({
        ...prev,
        synonymes: [...prev.synonymes, synonyme],
      }));
      setSynonymeInput("");
    }
  };

  const removeSynonyme = (index) => {
    setFormData((prev) => ({
      ...prev,
      synonymes: prev.synonymes.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est requis";
    } else if (formData.nom.length < 2) {
      newErrors.nom = "Le nom doit contenir au moins 2 caractères";
    }

    if (!formData.famille) {
      newErrors.famille = "La famille olfactive est requise";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description =
        "La description ne peut pas dépasser 500 caractères";
    }

    if (formData.suggestedPositions.length === 0) {
      newErrors.suggestedPositions =
        "Au moins une position suggérée est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
      toast.success(
        note ? "Note modifiée avec succès" : "Note créée avec succès"
      );
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
      console.error("Erreur formulaire note:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* En-tête */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {note ? "Modifier la note" : "Nouvelle note olfactive"}
          </h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            type="button"
          >
            <X className={styles.icon} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.body}>
            {/* Nom */}
            <div className={styles.field}>
              <label className={styles.label}>Nom de la note *</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => handleInputChange("nom", e.target.value)}
                className={`${styles.input} ${
                  errors.nom ? styles.inputError : ""
                }`}
                placeholder="Ex: Jasmin, Bergamote, Santal..."
              />
              {errors.nom && (
                <span className={styles.errorText}>{errors.nom}</span>
              )}
            </div>

            {/* Famille et couleur */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Famille olfactive *</label>
                <select
                  value={formData.famille}
                  onChange={(e) => handleInputChange("famille", e.target.value)}
                  className={`${styles.select} ${
                    errors.famille ? styles.inputError : ""
                  }`}
                >
                  <option value="">Sélectionner une famille</option>
                  {FAMILLES_OLFACTIVES.map((famille) => (
                    <option key={famille} value={famille}>
                      {famille.charAt(0).toUpperCase() + famille.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.famille && (
                  <span className={styles.errorText}>{errors.famille}</span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Couleur</label>
                <div className={styles.colorContainer}>
                  <input
                    type="color"
                    value={formData.couleur}
                    onChange={(e) =>
                      handleInputChange("couleur", e.target.value)
                    }
                    className={styles.colorInput}
                  />
                  <div
                    className={styles.colorPreview}
                    style={{ backgroundColor: formData.couleur }}
                  ></div>
                  <span className={styles.colorValue}>{formData.couleur}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className={`${styles.textarea} ${
                  errors.description ? styles.inputError : ""
                }`}
                placeholder="Décrivez les caractéristiques de cette note..."
                rows={3}
              />
              <div className={styles.charCount}>
                {formData.description.length}/500
              </div>
              {errors.description && (
                <span className={styles.errorText}>{errors.description}</span>
              )}
            </div>

            {/* Positions suggérées */}
            <div className={styles.field}>
              <label className={styles.label}>Positions suggérées *</label>
              <div className={styles.positionsGrid}>
                {POSITIONS_DISPONIBLES.map((position) => (
                  <div
                    key={position.value}
                    className={`${styles.positionCard} ${
                      formData.suggestedPositions.includes(position.value)
                        ? styles.positionSelected
                        : ""
                    }`}
                    onClick={() => togglePosition(position.value)}
                  >
                    <div className={styles.positionHeader}>
                      <span className={styles.positionLabel}>
                        {position.label}
                      </span>
                      <div
                        className={`${styles.checkbox} ${
                          formData.suggestedPositions.includes(position.value)
                            ? styles.checkboxChecked
                            : ""
                        }`}
                      >
                        {formData.suggestedPositions.includes(position.value) &&
                          "✓"}
                      </div>
                    </div>
                    <p className={styles.positionDescription}>
                      {position.description}
                    </p>
                  </div>
                ))}
              </div>
              {errors.suggestedPositions && (
                <span className={styles.errorText}>
                  {errors.suggestedPositions}
                </span>
              )}
            </div>

            {/* Intensité et popularité */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Intensité ({formData.intensite}/10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.intensite}
                  onChange={(e) =>
                    handleInputChange("intensite", parseInt(e.target.value))
                  }
                  className={styles.range}
                />
                <div className={styles.rangeLabels}>
                  <span>Subtile</span>
                  <span>Intense</span>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Popularité ({formData.popularite}/100)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.popularite}
                  onChange={(e) =>
                    handleInputChange("popularite", parseInt(e.target.value))
                  }
                  className={styles.range}
                />
                <div className={styles.rangeLabels}>
                  <span>Rare</span>
                  <span>Très populaire</span>
                </div>
              </div>
            </div>

            {/* Synonymes */}
            <div className={styles.field}>
              <label className={styles.label}>Synonymes</label>
              <div className={styles.synonymesContainer}>
                <div className={styles.synonymeInput}>
                  <input
                    type="text"
                    value={synonymeInput}
                    onChange={(e) => setSynonymeInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addSynonyme())
                    }
                    className={styles.input}
                    placeholder="Ajouter un synonyme..."
                  />
                  <button
                    type="button"
                    onClick={addSynonyme}
                    className={styles.addButton}
                    disabled={!synonymeInput.trim()}
                  >
                    Ajouter
                  </button>
                </div>

                {formData.synonymes.length > 0 && (
                  <div className={styles.synonymesList}>
                    {formData.synonymes.map((synonyme, index) => (
                      <span key={index} className={styles.synonymeTag}>
                        {synonyme}
                        <button
                          type="button"
                          onClick={() => removeSynonyme(index)}
                          className={styles.removeButton}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Aperçu */}
            <div className={styles.preview}>
              <h4 className={styles.previewTitle}>Aperçu</h4>
              <div
                className={styles.previewCard}
                style={{ borderLeft: `4px solid ${formData.couleur}` }}
              >
                <div className={styles.previewHeader}>
                  <span className={styles.previewName}>
                    {formData.nom || "Nom de la note"}
                  </span>
                  <span
                    className={styles.previewBadge}
                    style={{ backgroundColor: formData.couleur }}
                  >
                    {formData.famille || "famille"}
                  </span>
                </div>

                {formData.suggestedPositions.length > 0 && (
                  <div className={styles.previewPositions}>
                    {formData.suggestedPositions.map((pos) => (
                      <span key={pos} className={styles.previewPosition}>
                        {pos}
                      </span>
                    ))}
                  </div>
                )}

                <div className={styles.previewMetrics}>
                  <span>Intensité: {formData.intensite}/10</span>
                  <span>Popularité: {formData.popularite}/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              <Save className={styles.icon} />
              {loading ? "Sauvegarde..." : note ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
