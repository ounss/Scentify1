import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, Sparkles, TrendingUp } from "lucide-react";
import { parfumAPI } from "../services/api";
import ParfumCard from "../components/ParfumCard";
import ParfumFilters from "../components/ParfumFilters";

export default function Home() {
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    genre: "tous",
    sortBy: "popularite",
    notes: [],
  });

  const [searchParams, setSearchParams] = useSearchParams();

  // Charger les parfums au démarrage et à chaque changement de filtres
  useEffect(() => {
    loadParfums();
  }, [filters, searchParams]);

  const loadParfums = async () => {
    try {
      setLoading(true);

      const params = {
        search: searchParams.get("search") || "",
        genre: filters.genre !== "tous" ? filters.genre : undefined,
        sortBy: filters.sortBy,
        notes: filters.notes.length > 0 ? filters.notes.join(",") : undefined,
        page: 1,
        limit: 20,
      };

      // Nettoyer les paramètres undefined
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );

      const response = await parfumAPI.getAll(params);
      setParfums(response.data.parfums || []);
    } catch (error) {
      console.error("Erreur chargement:", error);
      setParfums([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleQuickFilter = (genre) => {
    setFilters((prev) => ({
      ...prev,
      genre: genre === "Tous" ? "tous" : genre.toLowerCase(),
    }));
  };

  const handleFiltersApply = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const quickFilters = ["Tous", "Femme", "Homme", "Mixte"];
  const currentSearchTerm = searchParams.get("search") || "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="w-8 h-8 text-red-500" />
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Scentify
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Découvrez votre parfum idéal grâce à l'analyse des notes
              olfactives
            </p>

            {/* Barre de recherche */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="flex items-center">
                  <Search className="w-6 h-6 text-gray-400 ml-6" />
                  <input
                    type="text"
                    className="flex-1 px-4 py-4 text-lg placeholder-gray-500 bg-transparent border-none outline-none"
                    placeholder="Rechercher un parfum, une marque, une note..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 font-semibold transition-colors duration-300"
                  >
                    Rechercher
                  </button>
                </div>
              </div>
            </form>

            {/* Filtres rapides */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {quickFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleQuickFilter(filter)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    (filter === "Tous" && filters.genre === "tous") ||
                    filter.toLowerCase() === filters.genre
                      ? "bg-red-600 text-white shadow-lg transform scale-105"
                      : "bg-white text-gray-700 hover:bg-gray-100 shadow-md hover:shadow-lg"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Bouton filtres avancés */}
            <button
              onClick={() => setShowFilters(true)}
              className="inline-flex items-center space-x-2 bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Filter className="w-5 h-5" />
              <span>Filtres avancés</span>
              {(filters.notes.length > 0 ||
                filters.sortBy !== "popularite") && (
                <span className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded-full">
                  {filters.notes.length +
                    (filters.sortBy !== "popularite" ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Résultats */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Header des résultats */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {currentSearchTerm
                  ? `Résultats pour "${currentSearchTerm}"`
                  : "Parfums populaires"}
              </h2>
              <p className="text-gray-600">
                {loading
                  ? "Chargement..."
                  : `${parfums.length} parfum${
                      parfums.length > 1 ? "s" : ""
                    } trouvé${parfums.length > 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Tri */}
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-gray-500" />
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sortBy: e.target.value }))
                }
                className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="popularite">Plus populaires</option>
                <option value="recent">Nouveautés</option>
                <option value="nom">Nom A-Z</option>
                <option value="marque">Marque A-Z</option>
              </select>
            </div>
          </div>

          {/* Grille des parfums */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 shadow-lg animate-pulse"
                >
                  <div className="bg-gray-200 aspect-square rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : parfums.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {parfums.map((parfum, index) => (
                <div
                  key={parfum._id}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ParfumCard parfum={parfum} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-6">
                <Search className="w-20 h-20 mx-auto mb-4" />
              </div>
              <h3 className="text-2xl font-bold text-gray-600 mb-4">
                Aucun parfum trouvé
              </h3>
              <p className="text-gray-500 mb-8">
                Essayez de modifier vos filtres ou votre recherche
              </p>
              <button
                onClick={() => {
                  setSearchParams({});
                  setFilters({
                    genre: "tous",
                    sortBy: "popularite",
                    notes: [],
                  });
                  setSearchQuery("");
                }}
                className="bg-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Composant des filtres avancés */}
      <ParfumFilters
        show={showFilters}
        filters={filters}
        onApply={handleFiltersApply}
        onClose={() => setShowFilters(false)}
      />
    </div>
  );
}
