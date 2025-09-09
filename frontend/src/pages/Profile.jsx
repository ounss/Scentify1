// frontend/src/pages/Profile.jsx - Version stylisée cohérente avec Home/ParfumDetail
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Heart,
  Clock,
  Settings,
  Crown,
  Edit3,
  Save,
  X,
  Trash2,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { favoritesAPI, historyAPI, authAPI } from "../services/api";
import ParfumCard from "../components/ParfumCard";
import { toast } from "react-hot-toast";
import styles from "../styles/Profile.module.css";

export default function Profile() {
  const navigate = useNavigate();
  const {
    user,
    isAdmin,
    logout,
    updateUser,
    loading: authLoading,
  } = useAuth();

  // États locaux
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [favorites, setFavorites] = useState({ parfums: [] });
  const [history, setHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
  });

  // Chargement des données utilisateur
  useEffect(() => {
    if (user) {
      setEditForm({
        username: user.username,
        email: user.email,
      });
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      console.log("🔄 Chargement des données utilisateur...");

      const [favResponse, historyResponse] = await Promise.all([
        favoritesAPI.getFavorites().catch((err) => {
          console.warn("Erreur favoris:", err);
          return { data: { parfums: [], notes: [] } };
        }),
        historyAPI.getHistory({ limit: 20 }).catch((err) => {
          console.warn("Erreur historique:", err);
          return { data: [] };
        }),
      ]);

      console.log("📊 Réponse favoris brute:", favResponse);
      console.log("📊 Réponse historique brute:", historyResponse);

      // Gestion flexible des structures de données
      const favorisData = favResponse.data || favResponse || { parfums: [] };
      const histoireData = historyResponse.data || historyResponse || [];

      // Assurer que favorites a la bonne structure
      const favoritesFormatted = {
        parfums: Array.isArray(favorisData.parfums)
          ? favorisData.parfums
          : Array.isArray(favorisData)
          ? favorisData
          : [],
        notes: Array.isArray(favorisData.notes) ? favorisData.notes : [],
      };

      setFavorites(favoritesFormatted);
      setHistory(Array.isArray(histoireData) ? histoireData : []);

      console.log("✅ Données finales:", {
        favorisParfums: favoritesFormatted.parfums.length,
        historique: Array.isArray(histoireData) ? histoireData.length : 0,
      });
    } catch (error) {
      console.error("❌ Erreur chargement données:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // Gestion de l'édition du profil
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editForm.username.trim() || !editForm.email.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      // Appel API pour mettre à jour le profil
      const response = await authAPI.updateProfile(editForm);

      // Mettre à jour le contexte avec les nouvelles données
      updateUser(response.data);

      setIsEditing(false);
      toast.success("Profil mis à jour avec succès");

      setEditForm({
        username: response.data.username,
        email: response.data.email,
      });
    } catch (error) {
      console.error("Erreur mise à jour profil:", error);
      toast.error(error.response?.data?.message || "Erreur de mise à jour");
    }
  };

  // Supprimer un favori
  const removeFavorite = async (parfumId) => {
    if (!window.confirm("Retirer ce parfum des favoris ?")) return;

    try {
      await favoritesAPI.removeParfum(parfumId);
      setFavorites((prev) => ({
        ...prev,
        parfums: prev.parfums.filter((p) => p._id !== parfumId),
      }));
      toast.success("Retiré des favoris");
      window.dispatchEvent(new CustomEvent("favorisUpdated"));
    } catch (error) {
      console.error("Erreur suppression favori:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Vider l'historique
  const clearHistory = async () => {
    if (!window.confirm("Voulez-vous vraiment vider votre historique ?"))
      return;

    try {
      await historyAPI.clearHistory();
      setHistory([]);
      toast.success("Historique vidé");
    } catch (error) {
      console.error("Erreur clear history:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Déconnexion
  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      logout();
      toast.success("Déconnexion réussie");
      navigate("/");
    }
  };

  // Navigation vers admin
  const goToAdmin = () => navigate("/admin");

  // Configuration des onglets
  const tabs = [
    { id: "overview", label: "Aperçu", icon: User },
    {
      id: "favorites",
      label: "Favoris",
      icon: Heart,
      count: favorites.parfums.length,
    },
    { id: "history", label: "Historique", icon: Clock, count: history.length },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  // États de chargement
  if (authLoading || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement de votre profil...</p>
      </div>
    );
  }

  // Utilisateur non connecté
  if (!user) {
    return (
      <div className={styles.loading}>
        <div className={styles.errorState}>
          <User className={styles.errorIcon} />
          <h2>Profil non disponible</h2>
          <button onClick={() => navigate("/")} className={styles.backButton}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header avec navigation */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button onClick={() => navigate(-1)} className={styles.back}>
            <ArrowLeft className={styles.icon} />
            <span>Retour</span>
          </button>
          <h1 className={styles.pageTitle}>Mon Profil</h1>
          <div className={styles.headerActions}>
            {isAdmin && (
              <button
                onClick={goToAdmin}
                className={`${styles.iconButton} ${styles.adminButton}`}
              >
                <Shield className={styles.icon} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={styles.container}>
        {/* En-tête du profil */}
        <section className={`${styles.profileHeader} ${styles.fadeIn}`}>
          <div className={styles.profileInfo}>
            <div className={styles.avatarSection}>
              <div
                className={`${styles.avatar} ${
                  isAdmin ? styles.adminAvatar : ""
                }`}
              >
                <span className={styles.avatarText}>
                  {user.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              {isAdmin && (
                <div className={styles.adminBadge}>
                  <Crown className={styles.crownIcon} />
                </div>
              )}
            </div>

            <div className={styles.userDetails}>
              <h1 className={styles.username}>{user.username}</h1>
              <p className={styles.userEmail}>{user.email}</p>
              <div className={styles.memberSince}>
                Membre depuis{" "}
                {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>

            <div className={styles.quickStats}>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {favorites.parfums.length}
                </div>
                <div className={styles.statLabel}>Favoris</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{history.length}</div>
                <div className={styles.statLabel}>Consultations</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {Math.floor(
                    (Date.now() - new Date(user.createdAt)) /
                      (1000 * 60 * 60 * 24)
                  )}
                </div>
                <div className={styles.statLabel}>Jours</div>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation par onglets */}
        <nav className={`${styles.tabsNav} ${styles.slideUp}`}>
          <div className={styles.tabsList}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tabButton} ${
                  activeTab === tab.id ? styles.tabActive : ""
                }`}
              >
                <tab.icon className={styles.icon} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={styles.tabBadge}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Contenu des onglets */}
        <div className={`${styles.tabContent} ${styles.fadeIn}`}>
          {/* Onglet Aperçu */}
          {activeTab === "overview" && (
            <div className={styles.overviewContent}>
              <div className={styles.sectionTitle}>
                <h2>Aperçu de votre compte</h2>
              </div>

              <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.favoritesStat}`}>
                  <Heart className={styles.statIcon} />
                  <div className={styles.statInfo}>
                    <div className={styles.statNumber}>
                      {favorites.parfums.length}
                    </div>
                    <div className={styles.statDescription}>
                      Parfums favoris
                    </div>
                  </div>
                </div>

                <div className={`${styles.statCard} ${styles.historyStat}`}>
                  <Clock className={styles.statIcon} />
                  <div className={styles.statInfo}>
                    <div className={styles.statNumber}>{history.length}</div>
                    <div className={styles.statDescription}>
                      Parfums consultés
                    </div>
                  </div>
                </div>

                <div className={`${styles.statCard} ${styles.membershipStat}`}>
                  <User className={styles.statIcon} />
                  <div className={styles.statInfo}>
                    <div className={styles.statNumber}>
                      {Math.floor(
                        (Date.now() - new Date(user.createdAt)) /
                          (1000 * 60 * 60 * 24)
                      )}
                    </div>
                    <div className={styles.statDescription}>Jours membre</div>
                  </div>
                </div>
              </div>

              {/* Derniers favoris */}
              {favorites.parfums.length > 0 && (
                <div className={styles.recentSection}>
                  <div className={styles.sectionHeader}>
                    <h3>Derniers favoris</h3>
                    <button
                      onClick={() => setActiveTab("favorites")}
                      className={styles.seeAllButton}
                    >
                      Voir tout
                    </button>
                  </div>
                  <div className={styles.parfumsGrid}>
                    {favorites.parfums.slice(0, 4).map((parfum) => (
                      <ParfumCard key={parfum._id} parfum={parfum} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Onglet Favoris */}
          {activeTab === "favorites" && (
            <div className={styles.favoritesContent}>
              <div className={styles.sectionHeader}>
                <h2>Mes parfums favoris</h2>
                <span className={styles.count}>
                  {favorites.parfums.length} parfum
                  {favorites.parfums.length > 1 ? "s" : ""}
                </span>
              </div>

              {favorites.parfums.length > 0 ? (
                <div className={styles.parfumsGrid}>
                  {favorites.parfums.map((parfum) => (
                    <div key={parfum._id} className={styles.favoriteCard}>
                      <ParfumCard parfum={parfum} />
                      <button
                        onClick={() => removeFavorite(parfum._id)}
                        className={styles.removeButton}
                        aria-label="Retirer des favoris"
                      >
                        <Trash2 className={styles.icon} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Heart className={styles.emptyIcon} />
                  <h3>Aucun favori pour le moment</h3>
                  <p>Explorez nos parfums et ajoutez vos coups de cœur !</p>
                  <button
                    onClick={() => navigate("/")}
                    className={styles.exploreButton}
                  >
                    Découvrir des parfums
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Onglet Historique */}
          {activeTab === "history" && (
            <div className={styles.historyContent}>
              <div className={styles.sectionHeader}>
                <h2>Mon historique</h2>
                <div className={styles.historyActions}>
                  <span className={styles.count}>
                    {history.length} consultation{history.length > 1 ? "s" : ""}
                  </span>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className={styles.clearButton}
                    >
                      <Trash2 className={styles.icon} />
                      <span>Vider l'historique</span>
                    </button>
                  )}
                </div>
              </div>

              {history.length > 0 ? (
                <div className={styles.historyList}>
                  {history.map((item) => (
                    <div key={item._id} className={styles.historyItem}>
                      <div className={styles.historyInfo}>
                        <h4 className={styles.historyTitle}>
                          {item.parfum?.nom || "Parfum supprimé"}
                        </h4>
                        <p className={styles.historyMeta}>
                          {item.parfum?.marque && `${item.parfum.marque} • `}
                          Consulté le{" "}
                          {new Date(item.consultedAt).toLocaleDateString(
                            "fr-FR"
                          )}
                        </p>
                      </div>
                      {item.parfum && (
                        <button
                          onClick={() => navigate(`/parfum/${item.parfum._id}`)}
                          className={styles.revisitButton}
                        >
                          Revoir
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Clock className={styles.emptyIcon} />
                  <h3>Aucun historique</h3>
                  <p>Votre historique de consultations apparaîtra ici.</p>
                </div>
              )}
            </div>
          )}

          {/* Onglet Paramètres */}
          {activeTab === "settings" && (
            <div className={styles.settingsContent}>
              <div className={styles.sectionTitle}>
                <h2>Paramètres du compte</h2>
              </div>

              {isEditing ? (
                <form onSubmit={handleEditSubmit} className={styles.editForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="username" className={styles.label}>
                      Nom d'utilisateur
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={editForm.username}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveButton}>
                      <Save className={styles.icon} />
                      <span>Sauvegarder</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({
                          username: user.username,
                          email: user.email,
                        });
                      }}
                      className={styles.cancelButton}
                    >
                      <X className={styles.icon} />
                      <span>Annuler</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.profileDisplay}>
                  <div className={styles.settingsCard}>
                    <h3>Informations personnelles</h3>
                    <div className={styles.infoList}>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>
                          Nom d'utilisateur:
                        </span>
                        <span className={styles.infoValue}>
                          {user.username}
                        </span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Email:</span>
                        <span className={styles.infoValue}>{user.email}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Membre depuis:</span>
                        <span className={styles.infoValue}>
                          {new Date(user.createdAt).toLocaleDateString(
                            "fr-FR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className={styles.editButton}
                    >
                      <Edit3 className={styles.icon} />
                      <span>Modifier le profil</span>
                    </button>
                  </div>

                  <div className={styles.dangerZone}>
                    <h3>Zone de danger</h3>
                    <p>Actions irréversibles sur votre compte</p>
                    <button
                      onClick={handleLogout}
                      className={styles.logoutButton}
                    >
                      <LogOut className={styles.icon} />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
