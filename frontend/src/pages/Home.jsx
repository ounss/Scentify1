// frontend/src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import { parfumAPI, noteAPI } from "../services/api";
import ParfumCard from "../components/ParfumCard";
import styles from "../styles/Home.module.css";

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
        setError("");
        setParfums([]);
        return;
      }

      const noteIds = validNotes.map((note) => note._id);
      const response = await parfumAPI.getByNotes(noteIds);
      setParfums(response.data.parfums || []);

      if (validNotes.length < totalSearched) {
        setError(
          `${validNotes.length}/${totalSearched} notes trouvées. Parfums trouvés avec les notes valides.`
        );
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError("Erreur lors de la recherche par notes");
    } finally {
      setLoading(false);
    }
  };

  // Recherche standard par nom de parfum
  const searchByName = async (searchQuery) => {
    setLoading(true);
    setError("");

    try {
      const response = await parfumAPI.getAll({
        search: searchQuery,
        genre:
          activeGenreFilter === "Tous" ? null : activeGenreFilter.toLowerCase(),
        limit: 20,
      });
      setParfums(response.data.parfums || []);
    } catch (error) {
      console.error("Erreur:", error);
      setError("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (searchType === "notes") {
      searchByNotes(searchQuery);
    } else {
      searchByName(searchQuery);
    }

    // Update URL
    setSearchParams({ search: searchQuery, type: searchType });
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchParams({});
    setError("");
    loadParfums();
  };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Découvrez l'univers des parfums
            </h1>
            <p className={styles.heroSubtitle}>
              Explorez notre collection de fragrances exceptionnelles et trouvez
              votre signature olfactive
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchTypeToggle}>
              <button
                type="button"
                onClick={() => setSearchType("parfums")}
                className={`${styles.toggleBtn} ${
                  searchType === "parfums" ? styles.toggleBtnActive : ""
                }`}
              >
                Parfums
              </button>
              <button
                type="button"
                onClick={() => setSearchType("notes")}
                className={`${styles.toggleBtn} ${
                  searchType === "notes" ? styles.toggleBtnActive : ""
                }`}
              >
                Notes olfactives
              </button>
            </div>

            <div className={styles.searchInputGroup}>
              <div className={styles.searchInputWrapper}>
                <Search className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder={
                    searchType === "notes"
                      ? "Ex: rose, vanille, bergamote..."
                      : "Rechercher un parfum..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <button type="submit" className={styles.searchButton}>
                Rechercher
              </button>
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className={styles.clearButton}
              >
                Effacer la recherche
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Quick Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersContainer}>
          <div className={styles.filtersHeader}>
            <Filter className={styles.filterIcon} />
            <span className={styles.filtersTitle}>Filtrer par genre :</span>
          </div>
          <div className={styles.quickFilters}>
            {quickFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveGenreFilter(filter)}
                className={`${styles.filterButton} ${
                  activeGenreFilter === filter ? styles.filterButtonActive : ""
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}

      {/* Results Section */}
      <div className={styles.resultsSection}>
        <div className={styles.resultsContainer}>
          {/* Results Header */}
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>
              {searchParams.get("search")
                ? `Résultats pour "${searchParams.get("search")}"`
                : "Parfums populaires"}
            </h2>
            <p className={styles.resultsCount}>
              {parfums.length} parfum{parfums.length > 1 ? "s" : ""} trouvé
              {parfums.length > 1 ? "s" : ""}
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>Recherche en cours...</p>
            </div>
          )}

          {/* Results Grid */}
          {!loading && (
            <div className={styles.parfumsGrid}>
              {parfums.length > 0 ? (
                parfums.map((parfum) => (
                  <ParfumCard key={parfum._id} parfum={parfum} />
                ))
              ) : (
                <div className={styles.noResults}>
                  <p className={styles.noResultsTitle}>Aucun parfum trouvé</p>
                  <p className={styles.noResultsText}>
                    Essayez avec d'autres termes de recherche ou explorez nos
                    collections.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
