// frontend/src/pages/Home.jsx - CORRECTION RECHERCHE COMPLÈTE
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  Heart,
  Clock,
  Wand2,
} from "lucide-react";
import { parfumAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import ParfumCard from "../components/ParfumCard";
import ParfumFilters from "../components/ParfumFilters";
import AdvancedSearch from "../components/AdvancedSearch";
import ScentifyLogo from "../components/ScentifyLogo";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [filters, setFilters] = useState({
    genre: "tous",
    sortBy: "popularite",
    notes: [],
  });

  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ CHARGEMENT INITIAL AU MONTAGE
  useEffect(() => {
    loadParfums();
  }, []);

  // ✅ ÉCOUTE DES CHANGEMENTS DE FILTRES ET RECHERCHE
  useEffect(() => {
    const searchTerm = searchParams.get("search");
    if (searchTerm !== searchQuery) {
      setSearchQuery(searchTerm || "");
    }
    loadParfums();
  }, [filters, searchParams]);

  // ✅ FONCTION DE CHARGEMENT PARFUMS CORRIGÉE
  const loadParfums = async () => {
    try {
      setLoading(true);

      const currentSearch = searchParams.get("search") || "";

      const params = {
        search: currentSearch,
        genre: filters.genre !== "tous" ? filters.genre : undefined,
        sortBy: filters.sortBy,
        notes: filters.notes.length > 0 ? filters.notes.join(",") : undefined,
        page: 1,
        limit: 24,
      };

      // Nettoyer les paramètres undefined
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      console.log("🔍 Recherche avec paramètres:", params);

      const response = await parfumAPI.getAll(params);
      setParfums(response.data.parfums || []);

      console.log(`✅ ${response.data.parfums?.length || 0} parfums trouvés`);
    } catch (error) {
      console.error("❌ Erreur chargement parfums:", error);
      setParfums([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ GESTION RECHERCHE TEXTUELLE
  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();

    if (query) {
      console.log("🔍 Nouvelle recherche:", query);
      setSearchParams({ search: query });
    } else {
      console.log("🔍 Effacement recherche");
      setSearchParams({});
    }
  };

  // ✅ FILTRES RAPIDES
  const handleQuickFilter = (genre) => {
    const newGenre = genre === "Tous" ? "tous" : genre.toLowerCase();
    console.log("🎯 Filtre rapide:", newGenre);

    setFilters((prev) => ({
      ...prev,
      genre: newGenre,
    }));
  };

  // ✅ APPLICATION FILTRES AVANCÉS
  const handleFiltersApply = (newFilters) => {
    console.log("🎯 Application filtres:", newFilters);
    setFilters(newFilters);
    setShowFilters(false);
  };

  // ✅ RÉINITIALISATION
  const handleReset = () => {
    console.log("🔄 Réinitialisation complète");
    setSearchParams({});
    setSearchQuery("");
    setFilters({
      genre: "tous",
      sortBy: "popularite",
      notes: [],
    });
  };

  const quickFilters = ["Tous", "Femme", "Homme", "Mixte"];
  const currentSearchTerm = searchParams.get("search") || "";

  // ✅ SUGGESTIONS POPULAIRES (données statiques pour le prototype)
  const popularSuggestions = [
    {
      id: "67501234567890abcdef1234",
      name: "Sauvage",
      brand: "Dior",
      image:
        "https://images.unsplash.com/photo-1541643600914-78b084683601?w=100&h=100&fit=crop",
    },
    {
      id: "67501234567890abcdef1235",
      name: "Black Orchid",
      brand: "Tom Ford",
      image:
        "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=100&h=100&fit=crop",
    },
    {
      id: "67501234567890abcdef1236",
      name: "La Vie Est Belle",
      brand: "Lancôme",
      image:
        "https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?w=100&h=100&fit=crop",
    },
  ];

  const faqItems = [
    {
      question: "Comment fonctionne Scentify ?",
      answer:
        "Scentify analyse les notes olfactives de vos parfums préférés pour vous recommander des fragrances similaires basées sur des algorithmes de correspondance.",
    },
    {
      question: "Les parfums recommandés sont-ils fiables ?",
      answer:
        "Nos recommandations sont basées sur l'analyse scientifique des notes olfactives et les retours de notre communauté d'utilisateurs.",
    },
    {
      question: "Comment puis-je acheter un parfum ?",
      answer:
        "Scentify vous redirige vers nos partenaires marchands de confiance où vous pouvez acheter les parfums en toute sécurité.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ HERO SECTION MOBILE-FIRST */}
      <section className="bg-white pt-4 pb-8">
        <div className="max-w-md mx-auto px-4">
          {/* Logo centré */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-3">
              <ScentifyLogo size={40} className="text-red-500" />
              <h1 className="text-3xl font-bold text-gray-800">Scentify</h1>
            </div>
            <p className="text-gray-600 mt-2">Découvrez votre parfum idéal</p>
          </div>

          {/* ✅ BARRE DE RECHERCHE FONCTIONNELLE */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative bg-gray-50 rounded-2xl border border-gray-200">
              <div className="flex items-center">
                <Search className="w-5 h-5 text-gray-400 ml-4" />
                <input
                  type="text"
                  className="flex-1 px-4 py-4 bg-transparent border-none outline-none placeholder-gray-500"
                  placeholder="Rechercher un parfum ou une note..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchParams({});
                    }}
                    className="mr-4 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* ✅ BOUTONS RAPIDES */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => navigate(isAuthenticated ? "/history" : "/auth")}
              className="flex flex-col items-center justify-center py-4 bg-gray-100 rounded-2xl text-gray-600 hover:bg-white hover:shadow-sm transition-all"
            >
              <Clock className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Historique</span>
            </button>

            <button
              onClick={() => navigate(isAuthenticated ? "/favorites" : "/auth")}
              className="flex flex-col items-center justify-center py-4 bg-gray-100 rounded-2xl text-gray-600 hover:bg-white hover:shadow-sm transition-all"
            >
              <Heart className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Favoris</span>
            </button>

            <button
              onClick={() => setShowAdvancedSearch(true)}
              className="flex flex-col items-center justify-center py-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl text-purple-600 hover:from-purple-200 hover:to-pink-200 transition-all"
            >
              <Wand2 className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Recherche+</span>
            </button>
          </div>
        </div>
      </section>

      {/* ✅ SUGGESTIONS POPULAIRES */}
      <section className="py-6">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              Suggestions populaires
            </h2>
            <button
              onClick={() => setShowAdvancedSearch(true)}
              className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Recherche Avancée</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {popularSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all"
                onClick={() => {
                  setSearchQuery(suggestion.name);
                  setSearchParams({ search: suggestion.name });
                }}
              >
                <div className="aspect-square bg-gray-100 rounded-lg mb-2">
                  <img
                    src={suggestion.image}
                    alt={suggestion.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <h3 className="font-medium text-sm text-gray-800 truncate">
                  {suggestion.name}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {suggestion.brand}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ✅ FAQ SECTION */}
      <section className="py-6">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">FAQ</h2>
          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100"
              >
                <summary className="p-4 cursor-pointer font-medium text-gray-800">
                  {item.question}
                </summary>
                <div className="px-4 pb-4 text-sm text-gray-600">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ✅ FILTRES DESKTOP/TABLET */}
      <section className="hidden md:block py-6 bg-white">
        <div className="container mx-auto px-4">
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

          {/* Actions */}
          <div className="flex items-center justify-center space-x-4">
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

            <button
              onClick={() => setShowAdvancedSearch(true)}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              <span>Recherche par Similarité</span>
            </button>
          </div>
        </div>
      </section>

      {/* ✅ RÉSULTATS PARFUMS DESKTOP/TABLET */}
      <section className="hidden md:block py-12">
        <div className="container mx-auto px-4">
          {/* Header résultats */}
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
                      parfums.length !== 1 ? "s" : ""
                    } trouvé${parfums.length !== 1 ? "s" : ""}`}
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

          {/* ✅ AFFICHAGE RÉSULTATS */}
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
            /* ✅ ÉTAT VIDE */
            <div className="text-center py-16">
              <Search className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-600 mb-4">
                {currentSearchTerm
                  ? "Aucun parfum trouvé"
                  : "Aucun parfum disponible"}
              </h3>
              <p className="text-gray-500 mb-8">
                {currentSearchTerm
                  ? `Aucun résultat pour "${currentSearchTerm}". Essayez des mots-clés différents.`
                  : "Chargez la base de données avec des parfums ou modifiez vos filtres."}
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={handleReset}
                  className="bg-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Réinitialiser les filtres
                </button>

                <button
                  onClick={() => setShowAdvancedSearch(true)}
                  className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Essayer la recherche avancée</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ✅ RÉSULTATS MOBILE */}
      <section className="block md:hidden py-6">
        <div className="max-w-md mx-auto px-4">
          {currentSearchTerm && (
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Résultats pour "{currentSearchTerm}"
              </h3>
              <p className="text-gray-600 text-sm">
                {loading
                  ? "Recherche..."
                  : `${parfums.length} parfum${
                      parfums.length !== 1 ? "s" : ""
                    } trouvé${parfums.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 shadow-sm animate-pulse"
                >
                  <div className="flex space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : parfums.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {parfums.slice(0, 10).map((parfum) => (
                <div
                  key={parfum._id}
                  className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate(`/parfum/${parfum._id}`)}
                >
                  <img
                    src={
                      parfum.photo ||
                      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=150&h=150&fit=crop"
                    }
                    alt={parfum.nom}
                    className="w-full aspect-square object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-semibold text-sm text-gray-800 truncate">
                    {parfum.nom}
                  </h3>
                  <p className="text-xs text-gray-600 truncate">
                    {parfum.marque}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        parfum.genre === "homme"
                          ? "bg-blue-100 text-blue-800"
                          : parfum.genre === "femme"
                          ? "bg-pink-100 text-pink-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {parfum.genre}
                    </span>
                    <Heart className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          ) : currentSearchTerm ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-600 mb-2">
                Aucun résultat trouvé
              </h3>
              <p className="text-gray-500 mb-6 text-sm">
                Essayez avec d'autres mots-clés ou explorez nos suggestions
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchParams({});
                }}
                className="bg-red-600 text-white px-6 py-2 rounded-xl font-semibold text-sm"
              >
                Effacer la recherche
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {/* ✅ MODALS */}
      <ParfumFilters
        show={showFilters}
        filters={filters}
        onApply={handleFiltersApply}
        onClose={() => setShowFilters(false)}
      />

      <AdvancedSearch
        show={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
      />
    </div>
  );
}
