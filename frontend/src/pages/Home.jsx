import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import { parfumAPI } from "../services/api";
import ParfumCard from "../components/ParfumCard";

export default function Home() {
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadParfums();
  }, [searchParams]);

  const loadParfums = async () => {
    setLoading(true);
    try {
      const search = searchParams.get("search");
      const response = await parfumAPI.getAll({
        search,
        limit: 20,
      });
      setParfums(response.data.parfums || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery });
    } else {
      setSearchParams({});
    }
  };

  const quickFilters = ["Tous", "Femme", "Homme", "Mixte"];

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
          <button key={filter} className="btn btn-secondary whitespace-nowrap">
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
