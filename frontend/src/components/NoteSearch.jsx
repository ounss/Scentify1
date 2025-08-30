import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { noteAPI, parfumAPI } from "../services/api";
import ParfumCard from "./ParfumCard";

export default function NoteSearch() {
  const [noteInput, setNoteInput] = useState("");
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fonction de validation des notes
  const validateNotesInput = async (input) => {
    const noteNames = input.split(",").map((n) => n.trim());
    const validNotes = [];

    for (const name of noteNames) {
      try {
        const response = await noteAPI.search(name);
        if (response.data.length > 0) {
          validNotes.push(response.data[0]);
        }
      } catch (err) {
        console.error(`Erreur recherche note ${name}:`, err);
      }
    }

    return validNotes;
  };

  // Fonction de recherche multiple notes
  const handleMultipleNotesSearch = async (noteNames) => {
    setLoading(true);
    setError("");

    try {
      const validNotes = await validateNotesInput(noteNames);

      if (validNotes.length === 0) {
        setError("Aucune note trouvée avec ces noms");
        setParfums([]);
        return;
      }

      const noteIds = validNotes.map((note) => note._id);
      const response = await parfumAPI.getByNotes(noteIds);
      setParfums(response.data.parfums || []);

      if (validNotes.length < noteNames.split(",").length) {
        setError("Certaines notes n'ont pas été trouvées");
      }
    } catch (err) {
      setError("Erreur lors de la recherche");
      setParfums([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (noteInput.trim()) {
      handleMultipleNotesSearch(noteInput);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Recherche par Notes Olfactives
        </h2>
        <p className="text-gray-600 mb-6">
          Entrez plusieurs notes séparées par des virgules (ex: "Jasmin,
          Vanille")
        </p>

        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Jasmin, Vanille, Rose..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Recherche..." : "Rechercher"}
          </button>
        </form>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}
      </div>

      {parfums.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {parfums.map((parfum) => (
            <ParfumCard key={parfum._id} parfum={parfum} />
          ))}
        </div>
      )}
    </div>
  );
}
