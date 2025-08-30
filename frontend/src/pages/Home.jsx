// frontend/src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import { parfumAPI, noteAPI } from "../services/api";
import ParfumCard from "../components/ParfumCard";

export default function Home() {
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchType, setSearchType] = useState("parfums"); // parfums, notes
  const [error, setError] = useState("");

  // Filtre de genre actif
  const [activeGenreFilter, setActiveGenreFilter] = useState("Tous");

  const quickFilters = ["Tous", "Femme", "Homme", "Mixte"];

  // Charger les parfums au démarrage
  useEffect(() => {
    loadParfums();
  }, [searchParams, activeGenreFilter]);

  // Load parfums avec prise en compte du genre
  const loadParfums = async () => {
    setLoading(true);
    setError("");

    try {
      const search = searchParams.get("search");
      const genre =
        activeGenreFilter === "Tous" ? null : activeGenreFilter.toLowerCase();

      const response = await parfumAPI.getAll({
        search,
        genre,
        limit: 20,
      });
      setParfums(response.data.parfums || []);
    } catch (error) {
      console.error("Erreur:", error);
      setError("Erreur lors du chargement des parfums");
    } finally {
      setLoading(false);
    }
  };

  // Validation des notes olfactives
  const validateNotesInput = async (input) => {
    const noteNames = input
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    const validNotes = [];

    for (const name of noteNames) {
      try {
        const response = await noteAPI.search(name);
        if (response.data && response.data.length > 0) {
          validNotes.push(response.data[0]);
        }
      } catch (err) {
        console.error(`Erreur recherche note ${name}:`, err);
      }
    }

    return { validNotes, totalSearched: noteNames.length };
  };

  // Recherche par notes olfactives multiples
  const searchByNotes = async (noteInput) => {
    setLoading(true);
    setError("");

    try {
      const { validNotes, totalSearched } = await validateNotesInput(noteInput);

      if (validNotes.length === 0) {
        setError("Aucune note trouvée avec ces noms");
        setParfums([]);
        return;
      }

      const noteIds = validNotes.map((note) => note._id);
      const response = await parfumAPI.getByNotes(noteIds);
      setParfums(response.data.parfums || []);

      if (validNotes.length < totalSearched) {
        setError(
          `${validNotes.length}/${totalSearched} notes trouvées. Certaines notes n'ont pas été reconnues.`
        );
      }
    } catch (err) {
      console.error("Erreur recherche notes:", err);
      setError("Erreur lors de la recherche par notes");
      setParfums([]);
    } finally {
      setLoading(false);
    }
  };

  // Détection automatique du type de recherche
  const detectSearchType = (query) => {
    // Si contient des virgules, c'est probablement une recherche par notes multiples
    if (query.includes(",")) {
      return "notes";
    }

    // Si le terme ressemble à une note olfactive courante
    const commonNotes = [
      "vanille",
      "jasmin",
      "rose",
      "musc",
      "ambre",
      "cèdre",
      "bergamote",
      "patchouli",
      "ylang",
      "iris",
      "vetiver",
      "santal",
      "oud",
      "neroli",
      "lavande",
      "citron",
      "orange",
      "pêche",
      "framboise",
      "chocolat",
    ];

    const lowerQuery = query.toLowerCase();
    const isNote = commonNotes.some(
      (note) => lowerQuery.includes(note) || note.includes(lowerQuery)
    );

    return isNote ? "notes" : "parfums";
  };

  // Gestion de la recherche unifiée
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setSearchParams({});
      loadParfums();
      return;
    }

    const detectedType = detectSearchType(searchQuery);
    setSearchType(detectedType);

    if (detectedType === "notes" || searchQuery.includes(",")) {
      // Recherche par notes olfactives
      await searchByNotes(searchQuery);
    } else {
      // Recherche classique par parfums
      setSearchParams({ search: searchQuery });
    }
  };

  // Gestion des filtres de genre
  const handleGenreFilter = (genre) => {
    setActiveGenreFilter(genre);
    setError(""); // Clear error when changing filters
  };

  // Réinitialiser la recherche
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchParams({});
    setError("");
    setSearchType("parfums");
    loadParfums();
  };

  return (
    <div className="container py-4">
      {/* Hero */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Découvrez votre parfum idéal
        </h1>
        <p className="text-gray-600">Plus de 1000 fragrances à explorer</p>
      </div>

      {/* Recherche unifiée */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="form-search relative">
            <Search className="form-search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Rechercher un parfum, une marque, ou des notes (ex: jasmin, vanille)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </form>

        {/* Indicateur du type de recherche */}
        {searchQuery && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              Type de recherche détecté:
              <span className="font-medium ml-1">
                {searchType === "notes"
                  ? "Recherche par notes olfactives"
                  : "Recherche par parfums/marques"}
              </span>
            </span>
          </div>
        )}

        {/* Message d'aide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
          <strong>💡 Astuce:</strong>
          <ul className="mt-1 ml-4 list-disc space-y-1">
            <li>
              Tapez le nom d'un parfum ou d'une marque pour une recherche
              classique
            </li>
            <li>
              Tapez des notes séparées par des virgules (ex: "jasmin, vanille")
              pour trouver des parfums contenant ces notes
            </li>
            <li>La recherche détecte automatiquement le type souhaité</li>
          </ul>
        </div>
      </div>

      {/* Filtres rapides de genre */}
      <div className="flex gap-2 overflow-x-auto mb-6">
        {quickFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => handleGenreFilter(filter)}
            className={`btn whitespace-nowrap ${
              activeGenreFilter === filter ? "btn-primary" : "btn-secondary"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Messages d'erreur/info */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Résultats */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {searchType === "notes"
              ? "Recherche par notes..."
              : "Chargement..."}
          </p>
        </div>
      ) : parfums.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-gray-600">
            {parfums.length} parfum{parfums.length > 1 ? "s" : ""} trouvé
            {parfums.length > 1 ? "s" : ""}
            {searchQuery &&
              searchType === "notes" &&
              " correspondant aux notes recherchées"}
          </div>
          <div className="grid grid-2 gap-4">
            {parfums.map((parfum) => (
              <ParfumCard key={parfum._id} parfum={parfum} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">
            Aucun parfum trouvé
          </h3>
          <p className="text-gray-500">
            {searchQuery
              ? searchType === "notes"
                ? "Essayez d'autres noms de notes ou vérifiez l'orthographe"
                : "Essayez d'autres mots-clés ou filtres"
              : "Commencez par faire une recherche ou utilisez les filtres"}
          </p>
        </div>
      )}
    </div>
  );
}
