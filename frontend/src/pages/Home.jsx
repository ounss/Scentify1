// frontend/src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { parfumAPI } from "../services/api";
import ParfumCard from "../components/ParfumCard";
import NoteSearch from "../components/NoteSearch";

export default function Home() {
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ Nouveau: filtre de genre actif
  const [activeGenreFilter, setActiveGenreFilter] = useState("Tous");

  const quickFilters = ["Tous", "Femme", "Homme", "Mixte"];

  // ✅ Charger les parfums au démarrage et à chaque changement de recherche/filtre
  useEffect(() => {
    loadParfums();
  }, [searchParams, activeGenreFilter]);

  
  // ✅ Load avec prise en compte du genre
  const loadParfums = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Recherche via la barre de recherche
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery });
    } else {
      setSearchParams({});
    }
  };
// Ajoutez l'import
import NoteSearch from "../components/NoteSearch";


{activeTab === "notes" ? <NoteSearch /> :// Dans le composant Home, ajoutez un onglet ou section :
const [activeTab, setActiveTab] = useState("parfums"); // parfums ou notes

// Dans le JSX, ajoutez :
<div className="mb-6">
  <div className="flex gap-2">
    <button
      onClick={() => setActiveTab("parfums")}
      className={`px-4 py-2 rounded-lg ${activeTab === "parfums" ? "bg-purple-600 text-white" : "bg-gray-200"}`}
    >
      Recherche Parfums
    </button>
    <button
      onClick={() => setActiveTab("notes")}
      className={`px-4 py-2 rounded-lg ${activeTab === "notes" ? "bg-purple-600 text-white" : "bg-gray-200"}`}
    >
      Recherche par Notes
    </button>
  </div>
</div>
}
  // ✅ Gestion clic filtres genre
  const handleGenreFilter = (genre) => {
    setActiveGenreFilter(genre);
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

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="form-search">
          <Search className="form-search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Rechercher un parfum..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>

      {/* Quick Filters */}
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

      {/* Results */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : parfums.length > 0 ? (
        <div className="grid grid-2 gap-4">
          {parfums.map((parfum) => (
            <ParfumCard key={parfum._id} parfum={parfum} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">
            Aucun parfum trouvé
          </h3>
          <p className="text-gray-500">Essayez d'autres mots-clés</p>
        </div>
      )}
    </div>
  );
}
