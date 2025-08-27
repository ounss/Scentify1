// frontend/src/pages/ParfumForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Camera, Heart } from "lucide-react";
import { noteAPI, parfumAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function ParfumForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isEdit = location.pathname.includes("/edit");

  const [formData, setFormData] = useState({
    nom: "",
    marque: "",
    genre: "",
    description: "",
    notes: {
      tete: [],
      coeur: [],
      fond: [],
    },
  });

  const [allNotes, setAllNotes] = useState({
    tete: [],
    coeur: [],
    fond: [],
  });

  const [loading, setLoading] = useState(false);

  // Charger les notes disponibles
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const types = ["tête", "cœur", "fond"];
      const notesData = {};

      for (const type of types) {
        const response = await noteAPI.getByType(type);
        notesData[type === "tête" ? "tete" : type] = response.data;
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
        notes: allSelectedNotes,
      };

      await parfumAPI.create(parfumData);
      toast.success("Parfum créé avec succès !");
      navigate("/");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la création"
      );
    } finally {
      setLoading(false);
    }
  };

  const genres = [
    { value: "femme", label: "Femme", color: "from-pink-500 to-rose-500" },
    { value: "homme", label: "Homme", color: "from-blue-500 to-indigo-500" },
    { value: "mixte", label: "Mixte", color: "from-purple-500 to-violet-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">
              {isEdit ? "Modifier" : "Nouveau parfum"}
            </h1>
            <div className="w-8"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto px-4 py-6 pb-20"
      >
        {/* Photo placeholder */}
        <div className="mb-6">
          <div className="aspect-square bg-gray-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
            <Camera className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-gray-500 text-sm">Ajouter une photo</span>
          </div>
        </div>

        {/* Nom du parfum */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nom du parfum *
          </label>
          <input
            type="text"
            value={formData.nom}
            onChange={(e) => handleInputChange("nom", e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Ex: Sauvage"
            required
          />
        </div>

        {/* Marque */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Marque *
          </label>
          <input
            type="text"
            value={formData.marque}
            onChange={(e) => handleInputChange("marque", e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Ex: Dior"
            required
          />
          <Heart className="absolute top-1/2 right-4 transform -translate-y-1/2 w-5 h-5 text-gray-300" />
        </div>

        {/* Genre */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Genre *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {genres.map((genre) => (
              <button
                key={genre.value}
                type="button"
                onClick={() => handleInputChange("genre", genre.value)}
                className={`p-3 rounded-xl font-medium transition-all ${
                  formData.genre === genre.value
                    ? `bg-gradient-to-r ${genre.color} text-white shadow-lg transform scale-105`
                    : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                }`}
              >
                {genre.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes olfactives */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Notes olfactives
          </h3>

          {Object.entries(allNotes).map(([type, notes]) => (
            <div key={type} className="mb-6">
              <h4
                className={`font-semibold mb-3 capitalize ${
                  type === "tete"
                    ? "text-yellow-700"
                    : type === "coeur"
                    ? "text-pink-700"
                    : "text-purple-700"
                }`}
              >
                Notes de {type === "tete" ? "tête" : type}
              </h4>

              <div className="grid grid-cols-2 gap-2">
                {notes.slice(0, 8).map((note) => (
                  <button
                    key={note._id}
                    type="button"
                    onClick={() => handleNoteToggle(type, note._id)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      formData.notes[type].includes(note._id)
                        ? `${
                            type === "tete"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                              : type === "coeur"
                              ? "bg-pink-100 text-pink-800 border-pink-300"
                              : "bg-purple-100 text-purple-800 border-purple-300"
                          } border-2`
                        : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {note.nom}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            placeholder="Décrivez ce parfum..."
          />
        </div>

        {/* Bouton submit */}
        <button
          type="submit"
          disabled={
            loading || !formData.nom || !formData.marque || !formData.genre
          }
          className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 rounded-2xl font-semibold text-lg hover:from-red-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Création...
            </div>
          ) : isEdit ? (
            "Modifier le parfum"
          ) : (
            "Créer le parfum"
          )}
        </button>
      </form>
    </div>
  );
}
