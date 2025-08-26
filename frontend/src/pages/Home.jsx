import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { parfumAPI } from "../services/api";
import ParfumCard from "../components/ParfumCard";

export default function Home() {
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("popularite");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadParfums();
  }, [searchParams, activeFilter, sortBy]);

  const loadParfums = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchParams.get("search") || "",
        genre: getGenreFilter(activeFilter),
        sortBy: sortBy,
        page: 1,
        limit: 20,
      };

      const response = await parfumAPI.getAll(params);
      setParfums(response.data.parfums || []);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGenreFilter = (filter) => {
    const mapping = {
      Tous: "",
      Femme: "femme",
      Homme: "homme",
      Mixte: "mixte",
    };
    return mapping[filter] || "";
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  const filterButtons = [
    "Tous",
    "Femme",
    "Homme",
    "Mixte",
    "Boisé",
    "Fleuri",
    "Fruité",
    "Oriental",
    "Frais",
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">Découvrez votre parfum idéal</h1>
          <p className="hero-subtitle">
            Explorez notre collection unique guidée par les notes olfactives
          </p>

          <form onSubmit={handleSearch} className="search-box">
            <svg
              className="search-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="form-input search-input"
              placeholder="Rechercher un parfum, une marque, une note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary search-btn">
              Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* Filters */}
      <section className="filters">
        <div className="container">
          <div className="filter-chips">
            {filterButtons.map((filter) => (
              <button
                key={filter}
                className={`chip ${activeFilter === filter ? "active" : ""}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="products" id="parfums">
        <div className="container">
          <div className="products-header flex-between mb-3">
            <h2 className="products-title">Parfums populaires</h2>
            <select
              className="form-input"
              style={{ width: "auto", padding: "0.5rem 1rem" }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="popularite">Plus populaires</option>
              <option value="recent">Nouveautés</option>
              <option value="nom">Nom A-Z</option>
              <option value="marque">Marque A-Z</option>
            </select>
          </div>

          <div className="grid grid-4">
            {loading
              ? [...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="card skeleton"
                    style={{ height: "300px" }}
                  ></div>
                ))
              : parfums.map((parfum, index) => (
                  <div
                    key={parfum._id}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <ParfumCard parfum={parfum} />
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* Notes Section */}
      <section
        className="products"
        id="notes"
        style={{ background: "var(--gray-100)" }}
      >
        <div className="container">
          <h2 className="products-title text-center mb-3">
            Explorer par notes olfactives
          </h2>

          <div className="grid grid-3">
            <div className="card">
              <div className="card-content text-center">
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                  🌸
                </div>
                <h3 className="card-title">Notes Florales</h3>
                <p className="card-subtitle">Rose, Jasmin, Iris</p>
                <button className="btn btn-primary mt-1">Explorer</button>
              </div>
            </div>

            <div className="card">
              <div className="card-content text-center">
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                  🌲
                </div>
                <h3 className="card-title">Notes Boisées</h3>
                <p className="card-subtitle">Cèdre, Santal, Vétiver</p>
                <button className="btn btn-primary mt-1">Explorer</button>
              </div>
            </div>

            <div className="card">
              <div className="card-content text-center">
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                  🍋
                </div>
                <h3 className="card-title">Notes Agrumes</h3>
                <p className="card-subtitle">Bergamote, Citron, Orange</p>
                <button className="btn btn-primary mt-1">Explorer</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
