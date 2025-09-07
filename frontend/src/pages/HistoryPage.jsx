// frontend/src/pages/HistoryFavoritesPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Heart,
  Search,
  Trash2,
  Eye,
  Calendar,
} from "lucide-react";
import { historyAPI, favoritesAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import ScentifyLogo from "../components/ScentifyLogo";
import toast from "react-hot-toast";
import styles from "../styles/HistoryPage.module.css";

export default function HistoryFavoritesPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ MODIFICATION : Détecter l'onglet initial via les paramètres URL
  const getInitialTab = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    return tab === "favorites" ? "favorites" : "history";
  };

  // États
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState({ parfums: [], notes: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  // ✅ CORRECTION : Historique — helper utilisable quand on "voit" un parfum
  const addToHistory = async (parfumId) => {
    try {
      if (!parfumId) return;
      await historyAPI.addToHistory(parfumId); // ✅ CORRIGÉ
    } catch (error) {
      console.warn("Erreur ajout historique:", error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  // Filtrage live sur l’onglet actif
  useEffect(() => {
    const currentData =
      activeTab === "history" ? history : favorites?.parfums || [];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const filtered = currentData.filter((item) => {
        // item d'historique : { parfum, consultedAt/dateVisite, ... }
        if (activeTab === "history") {
          const name = item?.parfum?.nom || "";
          const brand = item?.parfum?.marque || "";
          return (
            name.toLowerCase().includes(q) || brand.toLowerCase().includes(q)
          );
        }
        // item de favoris : objet parfum direct
        const name = item?.nom || "";
        const brand = item?.marque || "";
        return (
          name.toLowerCase().includes(q) || brand.toLowerCase().includes(q)
        );
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(currentData);
    }
  }, [searchQuery, history, favorites?.parfums, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyResponse, favoritesResponse] = await Promise.all([
        historyAPI.getHistory({ limit: 50 }),
        favoritesAPI.getFavorites(), // ✅ On récupère { parfums, notes }
      ]);

      setHistory(
        Array.isArray(historyResponse?.data) ? historyResponse.data : []
      );
      setFavorites(
        favoritesResponse?.data && typeof favoritesResponse.data === "object"
          ? favoritesResponse.data
          : { parfums: [], notes: [] }
      );
    } catch (error) {
      console.error("Erreur chargement données:", error);
      toast.error("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (window.confirm("Vider votre historique ?")) {
      try {
        await historyAPI.clearHistory();
        setHistory([]);
        setFilteredData(activeTab === "history" ? [] : filteredData);
        toast.success("Historique vidé");
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  // ✅ CORRECTION : retirer un favori (API corrigée)
  const removeFavoriteParfum = async (parfumId) => {
    try {
      await favoritesAPI.removeFavoriteParfum(parfumId); // ✅ CORRIGÉ
      setFavorites((prev) => ({
        ...prev,
        parfums: (prev?.parfums || []).filter((p) => p._id !== parfumId),
      }));
      // Si recherche active, mettre à jour la liste filtrée
      setFilteredData((prev) => prev.filter((p) => p._id !== parfumId));
      toast.success("Retiré des favoris");
    } catch (error) {
      console.warn("Erreur lors de la suppression du favori:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Voir un parfum : on ajoute à l'historique puis on navigue
  const handleViewParfum = async (parfumId) => {
    await addToHistory(parfumId);
    navigate(`/parfum/${parfumId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Aujourd'hui";
    if (diffDays === 2) return "Hier";
    if (diffDays <= 7) return `Il y a ${diffDays - 1} jours`;
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button
            onClick={() => navigate(-1)}
            className={styles.backButton}
            aria-label="Retour"
          >
            <ArrowLeft className={styles.icon} />
          </button>

          <ScentifyLogo size={28} className={styles.logo} />

          {activeTab === "history" && history.length > 0 && (
            <button
              onClick={clearHistory}
              className={styles.clearButton}
              aria-label="Vider l'historique"
            >
              <Trash2 className={styles.icon} />
            </button>
          )}

          {activeTab === "favorites" && <div className={styles.headerSpacer} />}
        </div>

        {/* Search */}
        <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder={`Rechercher dans ${
                activeTab === "history" ? "l'historique" : "les favoris"
              }...`}
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={styles.clearSearch}
                aria-label="Effacer la recherche"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button
              onClick={() => setActiveTab("history")}
              className={`${styles.tab} ${
                activeTab === "history" ? styles.tabActive : ""
              }`}
            >
              <Clock className={styles.tabIcon} />
              <span>Historique</span>
              <span className={styles.tabBadge}>{history.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`${styles.tab} ${
                activeTab === "favorites" ? styles.tabActive : ""
              }`}
            >
              <Heart className={styles.tabIcon} />
              <span>Favoris</span>
              <span className={styles.tabBadge}>
                {favorites?.parfums?.length || 0}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className={styles.container}>
        {activeTab === "history" ? (
          // Contenu Historique
          filteredData.length > 0 ? (
            <div className={styles.itemsList}>
              {filteredData.map((item) => (
                <article key={item._id} className={styles.historyItem}>
                  <div className={styles.itemContent}>
                    {item.parfum ? (
                      <>
                        <div className={styles.itemInfo}>
                          <h3 className={styles.parfumName}>
                            {item.parfum.nom}
                          </h3>
                          <div className={styles.parfumMeta}>
                            {item.parfum.marque && (
                              <span className={styles.brand}>
                                {item.parfum.marque}
                              </span>
                            )}
                            {item.parfum.genre && (
                              <span
                                className={`${styles.genre} ${
                                  styles[`genre${item.parfum.genre}`]
                                }`}
                              >
                                {item.parfum.genre}
                              </span>
                            )}
                          </div>
                          <div className={styles.visitDate}>
                            <Calendar className={styles.dateIcon} />
                            <span>
                              {formatDate(item.dateVisite || item.consultedAt)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleViewParfum(item.parfum._id)}
                          className={styles.viewButton}
                          aria-label={`Voir le parfum ${item.parfum.nom}`}
                        >
                          <Eye className={styles.icon} />
                        </button>
                      </>
                    ) : (
                      <div className={styles.deletedParfum}>
                        <div className={styles.itemInfo}>
                          <h3 className={styles.parfumName}>Parfum supprimé</h3>
                          <div className={styles.visitDate}>
                            <Calendar className={styles.dateIcon} />
                            <span>
                              {formatDate(item.dateVisite || item.consultedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : history.length > 0 && searchQuery ? (
            <div className={styles.emptyState}>
              <Search className={styles.emptyIcon} />
              <h2>Aucun résultat</h2>
              <p>Aucun parfum trouvé pour "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery("")}
                className={styles.resetButton}
              >
                Voir tout l'historique
              </button>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Clock className={styles.emptyIcon} />
              <h2>Historique vide</h2>
              <p>Vos parfums consultés apparaîtront ici.</p>
              <button
                onClick={() => navigate("/")}
                className={styles.exploreButton}
              >
                Explorer les parfums
              </button>
            </div>
          )
        ) : // Contenu Favoris
        filteredData.length > 0 ? (
          <div className={styles.itemsList}>
            {filteredData.map((parfum) => (
              <article key={parfum._id} className={styles.favoriteItem}>
                <div className={styles.itemContent}>
                  <div className={styles.itemInfo}>
                    <h3 className={styles.parfumName}>{parfum.nom}</h3>
                    <div className={styles.parfumMeta}>
                      {parfum.marque && (
                        <span className={styles.brand}>{parfum.marque}</span>
                      )}
                      {parfum.genre && (
                        <span
                          className={`${styles.genre} ${
                            styles[`genre${parfum.genre}`]
                          }`}
                        >
                          {parfum.genre}
                        </span>
                      )}
                    </div>
                    <div className={styles.favoriteDate}>
                      <Heart className={styles.dateIcon} />
                      <span>Ajouté aux favoris</span>
                    </div>
                  </div>

                  <div className={styles.favoriteActions}>
                    <button
                      onClick={() => handleViewParfum(parfum._id)}
                      className={styles.viewButton}
                      aria-label={`Voir le parfum ${parfum.nom}`}
                    >
                      <Eye className={styles.icon} />
                    </button>
                    <button
                      onClick={() => removeFavoriteParfum(parfum._id)}
                      className={styles.removeButton}
                      aria-label={`Retirer ${parfum.nom} des favoris`}
                    >
                      <Trash2 className={styles.icon} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (favorites?.parfums?.length || 0) > 0 && searchQuery ? (
          <div className={styles.emptyState}>
            <Search className={styles.emptyIcon} />
            <h2>Aucun résultat</h2>
            <p>Aucun parfum trouvé pour "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery("")}
              className={styles.resetButton}
            >
              Voir tous les favoris
            </button>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Heart className={styles.emptyIcon} />
            <h2>Aucun favori</h2>
            <p>Explorez nos parfums et ajoutez vos coups de cœur !</p>
            <button
              onClick={() => navigate("/")}
              className={styles.exploreButton}
            >
              Découvrir des parfums
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
