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
import style from "../styles/ParfumForm.module.css";

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

  // État des notes
  const [allNotes, setAllNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("tous");
  const [families, setFamilies] = useState([]);

  // État de l'interface
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [draggedNote, setDraggedNote] = useState(null);

  // Image
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadMode, setUploadMode] = useState("upload");

  // Liens marchands
  const [newMerchantLink, setNewMerchantLink] = useState({
    nom: "",
    url: "",
    prix: "",
  });
  const [showMerchantForm, setShowMerchantForm] = useState(false);

  // Chargement initial
  useEffect(() => {
    if (isEdit && id) {
      loadParfumData();
    }
    loadNotesAndFamilies();
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

  const loadNotesAndFamilies = async () => {
    try {
      console.log("🔍 Chargement des notes et familles...");

      // Charger toutes les notes
      const notesResp = await noteAPI.getNotesWithSuggestions();
      const notes = notesResp.data.notes || [];
      setAllNotes(notes);

      // Charger les familles
      const familiesResp = await noteAPI.getFamilies();
      setFamilies(familiesResp.data.families || []);

      console.log(
        `✅ ${notes.length} notes et ${familiesResp.data.families?.length} familles chargées`
      );
    } catch (error) {
      console.error("❌ Erreur chargement notes:", error);
      toast.error("Erreur lors du chargement des notes");
      setAllNotes([]);
      setFamilies([]);
    }
  };

  const filterNotes = () => {
    let filtered = allNotes;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (note) =>
          note.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (note.synonymes || []).some((syn) =>
            syn.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Filtre par famille
    if (selectedFamily !== "tous") {
      filtered = filtered.filter((note) => note.famille === selectedFamily);
    }

    setFilteredNotes(filtered);
  };

  // Gestion du drag & drop
  const handleDragStart = (e, note) => {
    setDraggedNote(note);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, position) => {
    e.preventDefault();
    if (!draggedNote) return;

    const field = `notes_${position}`;
    const currentNotes = formData[field] || [];

    // Vérifier si la note n'est pas déjà présente
    if (currentNotes.includes(draggedNote._id)) {
      toast.error(`${draggedNote.nom} est déjà dans les notes de ${position}`);
      setDraggedNote(null);
      return;
    }

    // Ajouter la note
    setFormData((prev) => ({
      ...prev,
      [field]: [...currentNotes, draggedNote._id],
    }));

    toast.success(`${draggedNote.nom} ajoutée aux notes de ${position}`);
    setDraggedNote(null);
  };

  const removeNoteFromPosition = (position, noteId) => {
    const field = `notes_${position}`;
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((id) => id !== noteId),
    }));
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
        "anneSortie",
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

      // Notes par position
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
        await parfumAPI.create(formDataToSend);
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

  // Fonction helper pour obtenir une note par ID
  const getNoteById = (noteId) => {
    return allNotes.find((note) => note._id === noteId);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du parfum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {isEdit ? "Modifier le parfum" : "Nouveau parfum"}
            </h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations de base */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Informations de base
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du parfum <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => handleInputChange("nom", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Sauvage"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marque <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.marque}
                  onChange={(e) => handleInputChange("marque", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Dior"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Genre <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.genre}
                  onChange={(e) => handleInputChange("genre", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  {genres.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année de sortie
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    value={formData.anneSortie}
                    onChange={(e) =>
                      handleInputChange("anneSortie", e.target.value)
                    }
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concentration
                </label>
                <select
                  value={formData.concentre}
                  onChange={(e) =>
                    handleInputChange("concentre", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {concentres.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix (€)
                </label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    value={formData.prix}
                    onChange={(e) => handleInputChange("prix", e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Décrivez ce parfum..."
              />
            </div>
          </div>

          {/* Performance */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Performance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Longévité
                </label>
                <select
                  value={formData.longevite}
                  onChange={(e) =>
                    handleInputChange("longevite", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Sélectionner</option>
                  {longeviteOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Droplets className="inline w-4 h-4 mr-1" />
                  Sillage
                </label>
                <select
                  value={formData.sillage}
                  onChange={(e) => handleInputChange("sillage", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Award className="inline w-4 h-4 mr-1" />
                  Popularité (0-100)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    value={formData.popularite}
                    onChange={(e) =>
                      handleInputChange("popularite", e.target.value)
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    min="0"
                    max="100"
                  />
                  <span className="bg-gray-100 px-3 py-1 rounded-md font-medium min-w-[3rem] text-center">
                    {formData.popularite}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notes olfactives avec Drag & Drop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Palette des notes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Palette des notes olfactives
              </h2>

              {/* Filtres */}
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Rechercher une note..."
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={selectedFamily}
                    onChange={(e) => setSelectedFamily(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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

              {/* Liste des notes */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredNotes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Aucune note trouvée
                  </p>
                ) : (
                  filteredNotes.map((note) => (
                    <div
                      key={note._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, note)}
                      className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-move transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: note.couleur || "#4a90e2" }}
                        ></div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {note.nom}
                          </div>
                          <div className="text-xs text-gray-500">
                            {note.famille}
                            {note.positionPreferee && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {note.positionPreferee}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Glisser
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Zones de dépôt */}
            <div className="space-y-6">
              {[
                {
                  key: "tete",
                  label: "Notes de tête",
                  color: "bg-yellow-50 border-yellow-200",
                  textColor: "text-yellow-800",
                },
                {
                  key: "coeur",
                  label: "Notes de cœur",
                  color: "bg-pink-50 border-pink-200",
                  textColor: "text-pink-800",
                },
                {
                  key: "fond",
                  label: "Notes de fond",
                  color: "bg-purple-50 border-purple-200",
                  textColor: "text-purple-800",
                },
              ].map(({ key, label, color, textColor }) => (
                <div key={key} className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className={`text-lg font-medium mb-4 ${textColor}`}>
                    <Star className="inline w-5 h-5 mr-2" />
                    {label}
                  </h3>

                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, key)}
                    className={`min-h-[120px] p-4 border-2 border-dashed rounded-lg ${color} transition-colors`}
                  >
                    {formData[`notes_${key}`]?.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <div className="text-sm">Déposez les notes ici</div>
                        <div className="text-xs mt-1">
                          ou glissez-déposez depuis la palette
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(formData[`notes_${key}`] || []).map((noteId) => {
                          const note = getNoteById(noteId);
                          if (!note) return null;

                          return (
                            <div
                              key={noteId}
                              className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border shadow-sm"
                            >
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: note.couleur || "#4a90e2",
                                }}
                              ></div>
                              <span className="text-sm font-medium">
                                {note.nom}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  removeNoteFromPosition(key, noteId)
                                }
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Image du parfum
            </h2>

            {/* Toggle Upload/URL */}
            <div className="flex space-x-4 mb-6">
              <button
                type="button"
                onClick={() => setUploadMode("upload")}
                className={`flex items-center px-4 py-2 rounded-md border transition-colors ${
                  uploadMode === "upload"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload fichier
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("url")}
                className={`flex items-center px-4 py-2 rounded-md border transition-colors ${
                  uploadMode === "url"
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                URL externe
              </button>
            </div>

            {/* Aperçu */}
            {(imagePreview || formData.imageUrl) && (
              <div className="relative mb-6 inline-block">
                <img
                  src={imagePreview || formData.imageUrl}
                  alt="Aperçu parfum"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={
                    imagePreview
                      ? removeUploadedImage
                      : () => handleInputChange("imageUrl", "")
                  }
                  className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Upload */}
            {uploadMode === "upload" && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="imageUpload" className="cursor-pointer">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-sm text-gray-600">
                    {imageFile ? "Changer l'image" : "Choisir une image"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    PNG, JPG, WEBP jusqu'à 5MB
                  </div>
                </label>
              </div>
            )}

            {/* URL */}
            {uploadMode === "url" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de l'image
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      handleInputChange("imageUrl", e.target.value)
                    }
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Liens marchands */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Liens marchands
              </h2>
              <button
                type="button"
                onClick={() => setShowMerchantForm(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </button>
            </div>

            {formData.liensMarchands.length > 0 ? (
              <div className="space-y-3">
                {formData.liensMarchands.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{link.nom}</h4>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        {link.url}
                      </a>
                      {link.prix && (
                        <div className="text-sm text-gray-600 mt-1">
                          {link.prix}€
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMerchantLink(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-4"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Aucun lien marchand ajouté
              </p>
            )}

            {showMerchantForm && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Nouveau lien marchand
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du marchand
                    </label>
                    <input
                      type="text"
                      value={newMerchantLink.nom}
                      onChange={(e) =>
                        setNewMerchantLink({
                          ...newMerchantLink,
                          nom: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ex: Sephora"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <input
                      type="url"
                      value={newMerchantLink.url}
                      onChange={(e) =>
                        setNewMerchantLink({
                          ...newMerchantLink,
                          url: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix (€)
                    </label>
                    <input
                      type="number"
                      value={newMerchantLink.prix}
                      onChange={(e) =>
                        setNewMerchantLink({
                          ...newMerchantLink,
                          prix: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowMerchantForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleAddMerchantLink}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <button
              type="submit"
              disabled={
                loading || !formData.nom || !formData.marque || !formData.genre
              }
              className="w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  {isEdit ? "Modification..." : "Création..."}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {isEdit ? "Modifier le parfum" : "Créer le parfum"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
