import React, { useState, useEffect } from "react";
import { X, Filter, RotateCcw, Check } from "lucide-react";
import { noteAPI } from "../../services/api";

export default function ParfumFilters({ show, filters, onApply, onClose }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [notes, setNotes] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);

  useEffect(() => {
    if (show) {
      setLocalFilters(filters);
      loadNotes();
    }
  }, [show, filters]);

  const loadNotes = async () => {
    try {
      const response = await noteAPI.getAll({ limit: 50 });
      setNotes(response.data.notes || []);
    } catch (error) {
      console.error("Erreur chargement notes:", error);
    }
  };

  const handleNoteToggle = (noteId) => {
    setSelectedNotes((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId]
    );
  };

  const resetFilters = () => {
    setLocalFilters({ genre: "tous", sortBy: "popularite" });
    setSelectedNotes([]);
  };

  const applyFilters = () => {
    onApply({
      ...localFilters,
      notes: selectedNotes,
    });
  };

  const notesByType = notes.reduce((acc, note) => {
    if (!acc[note.type]) acc[note.type] = [];
    acc[note.type].push(note);
    return acc;
  }, {});

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center md:justify-center">
      <div className="bg-white w-full md:w-full md:max-w-4xl md:max-h-[80vh] md:rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-2 rounded-xl">
              <Filter className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Filtres avancés
              </h2>
              <p className="text-gray-600">Affinez votre recherche</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Contenu filtres */}
        <div className="p-6 max-h-[60vh] md:max-h-[50vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Filtres généraux */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Genre
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: "tous",
                      label: "Tous",
                      color: "from-gray-500 to-gray-600",
                    },
                    {
                      value: "homme",
                      label: "Homme",
                      color: "from-blue-500 to-blue-600",
                    },
                    {
                      value: "femme",
                      label: "Femme",
                      color: "from-pink-500 to-pink-600",
                    },
                    {
                      value: "mixte",
                      label: "Mixte",
                      color: "from-purple-500 to-purple-600",
                    },
                  ].map((genre) => (
                    <button
                      key={genre.value}
                      onClick={() =>
                        setLocalFilters({ ...localFilters, genre: genre.value })
                      }
                      className={`p-4 rounded-xl font-medium transition-all ${
                        localFilters.genre === genre.value
                          ? `bg-gradient-to-r ${genre.color} text-white shadow-lg transform scale-105`
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {genre.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Tri
                </h3>
                <div className="space-y-2">
                  {[
                    { value: "popularite", label: "Plus populaires" },
                    { value: "nom", label: "Nom A-Z" },
                    { value: "marque", label: "Marque A-Z" },
                    { value: "recent", label: "Plus récents" },
                  ].map((sort) => (
                    <button
                      key={sort.value}
                      onClick={() =>
                        setLocalFilters({ ...localFilters, sortBy: sort.value })
                      }
                      className={`w-full p-3 rounded-xl font-medium text-left transition-all ${
                        localFilters.sortBy === sort.value
                          ? "bg-red-50 text-red-600 border border-red-200"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{sort.label}</span>
                        {localFilters.sortBy === sort.value && (
                          <Check className="w-4 h-4" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes olfactives */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Notes olfactives
                {selectedNotes.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-sm px-2 py-1 rounded-full">
                    {selectedNotes.length} sélectionnée
                    {selectedNotes.length > 1 ? "s" : ""}
                  </span>
                )}
              </h3>

              <div className="space-y-4">
                {Object.entries(notesByType).map(([type, notesList]) => (
                  <div key={type}>
                    <h4
                      className={`font-medium mb-3 capitalize ${
                        type === "tête"
                          ? "text-yellow-700"
                          : type === "cœur"
                          ? "text-pink-700"
                          : "text-purple-700"
                      }`}
                    >
                      Notes de {type}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {notesList.slice(0, 8).map((note) => (
                        <button
                          key={note._id}
                          onClick={() => handleNoteToggle(note._id)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            selectedNotes.includes(note._id)
                              ? `${
                                  type === "tête"
                                    ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                                    : type === "cœur"
                                    ? "bg-pink-100 text-pink-800 border border-pink-300"
                                    : "bg-purple-100 text-purple-800 border border-purple-300"
                                }`
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent"
                          }`}
                        >
                          {note.nom}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={resetFilters}
            className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Réinitialiser</span>
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={applyFilters}
              className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
