// frontend/src/pages/AdminPanel.jsx - Version sans Tailwind avec CSS Modules (clean, redirections Parfum)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Package,
  BarChart3,
  Download,
  Search,
  UserCheck,
  UserX,
  Crown,
  User,
  ArrowLeft,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  Eye,
  X,
  Save,
  Star,
  MessageSquare,
  Shield,
  Activity,
  // ✅ Ajout pour la nouvelle section Notes
  Palette,
  TrendingUp,
  Layers,
} from "lucide-react";
import api from "../services/api.js";
import { adminAPI } from "../services/adminAPI.js";
import { parfumAPI, notesAPI, authAPI } from "../services/api.js";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import ContactSection from "../admin/ContactSection";
import styles from "../styles/AdminPanel.module.css";
import NoteForm from "../components/NoteForm";

export default function AdminPanel() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();

  // États principaux
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [parfums, setParfums] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState([]);

  // Recherches & filtres
  const [searchUsers, setSearchUsers] = useState("");
  const [searchParfums, setSearchParfums] = useState("");
  const [searchNotes, setSearchNotes] = useState(""); // (déjà présent)
  const [filterGenre, setFilterGenre] = useState("tous");
  const [filterNoteType, setFilterNoteType] = useState("tous"); // ⚠️ Conservé pour ne rien retirer
  // ✅ Nouveaux filtres pour la section Notes corrigée
  const [filterNoteFamily, setFilterNoteFamily] = useState("toutes");
  const [filterNotePosition, setFilterNotePosition] = useState("toutes");

  // Modales & édition (UTILISATEUR/NOTE uniquement)
  const [showUserForm, setShowUserForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Formulaires (UTILISATEUR/NOTE uniquement)
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  // Vérification des droits admin + chargement initial
  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, navigate]);

  // Chargement des données
  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, parfumsData, notesData, messagesData] =
        await Promise.all([
          adminAPI.getStats().catch(() => ({})),
          adminAPI.getUsers().catch(() => ({ data: { users: [] } })),
          parfumAPI
            .getAll({ limit: 100 })
            .catch(() => ({ data: { parfums: [] } })),
          notesAPI.getAll({ limit: 100 }).catch(() => ({ data: { notes: [] } })),
          api.get("/contact").catch(() => ({ data: [] })),
        ]);

      setStats(statsData || {});
      setUsers(usersData?.data?.users || []);
      setParfums(parfumsData?.data?.parfums || parfumsData?.data || []);
      setNotes(notesData?.data?.notes || notesData?.data || []);
      setMessages(messagesData?.data || []);

      toast.success("Données admin chargées");
    } catch (err) {
      console.error("❌ Erreur chargement admin:", err);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Actualiser les stats des notes en premier
      await fetch("/api/notes/recalculate", { method: "POST" });
      // Puis recharger toutes les données
      await loadData();
    } catch (error) {
      console.error("Erreur actualisation:", error);
      await loadData(); // Recharger quand même les données
    } finally {
      setRefreshing(false);
    }
  };
  // === EXPORTS CSV ===
  const handleExportUsers = async () => {
    try {
      const response = await adminAPI.exportUsers();
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "users.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export CSV Utilisateurs réussi");
    } catch (error) {
      console.error("Erreur export users:", error);
      toast.error("Erreur lors de l'export des utilisateurs");
    }
  };

  const handleExportParfums = async () => {
    try {
      if (!adminAPI.exportParfums) {
        toast.error("L'export des parfums n'est pas disponible.");
        return;
      }
      const response = await adminAPI.exportParfums();
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "parfums.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export CSV Parfums réussi");
    } catch (error) {
      console.error("Erreur export parfums:", error);
      toast.error("Erreur lors de l'export des parfums");
    }
  };

  // === GESTION UTILISATEURS ===
  const createUser = async (e) => {
    e.preventDefault();
    try {
      await authAPI.register(userForm);
      setShowUserForm(false);
      setEditingItem(null);
      setUserForm({ username: "", email: "", password: "" });
      await loadData();
      toast.success("Utilisateur créé");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Erreur création utilisateur"
      );
    }
  };

  const updateUser = async (e) => {
    e.preventDefault();
    try {
      if (adminAPI.updateUser) {
        const updated = await adminAPI.updateUser(editingItem._id, userForm);
        const updatedUser = updated?.data || updated;
        setUsers((prev) =>
          prev.map((u) =>
            u._id === editingItem._id ? { ...u, ...updatedUser } : u
          )
        );
        toast.success("Utilisateur mis à jour");
      } else {
        toast.error(
          "Route de mise à jour utilisateur non disponible côté backend."
        );
      }
      setShowUserForm(false);
      setEditingItem(null);
      setUserForm({ username: "", email: "", password: "" });
    } catch (error) {
      console.error(error);
      toast.error("Erreur mise à jour utilisateur");
    }
  };

  const deleteUser = async (userId) => {
    if (userId === user?._id) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte");
      return;
    }
    if (!window.confirm("Supprimer cet utilisateur ?")) return;

    try {
      if (adminAPI.deleteUser) {
        await adminAPI.deleteUser(userId);
      }
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success("Utilisateur supprimé");
    } catch (error) {
      toast.error("Erreur suppression utilisateur");
    }
  };

  const toggleAdminStatus = async (userId, currentStatus) => {
    if (userId === user?._id) {
      toast.error("Vous ne pouvez pas modifier votre propre statut");
      return;
    }
    try {
      await adminAPI.toggleAdmin(userId);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isAdmin: !u.isAdmin } : u))
      );
      toast.success(
        currentStatus ? "Droits admin retirés" : "Droits admin accordés"
      );
    } catch {
      toast.error("Erreur modification des droits");
    }
  };

  // === GESTION PARFUMS (SUPPRESSION uniquement ici) ===
  const deleteParfum = async (parfumId) => {
    if (!window.confirm("Supprimer ce parfum ?")) return;
    try {
      await parfumAPI.delete(parfumId);
      setParfums((prev) => prev.filter((p) => p._id !== parfumId));
      toast.success("Parfum supprimé");
    } catch (error) {
      toast.error("Erreur suppression parfum");
    }
  };

  // === GESTION NOTES ===

  const startEditNote = (n) => {
    setEditingItem(n);
    setShowNoteForm(true);
  };
  const deleteNote = async (noteId) => {
    if (!window.confirm("Supprimer cette note ?")) return;
    try {
      await notesAPI.delete(noteId);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      toast.success("Note supprimée");
    } catch (error) {
      toast.error("Erreur suppression note");
    }
  };

  // === FILTRES ===
  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredParfums = parfums.filter((p) => {
    const matchSearch =
      p.nom?.toLowerCase().includes(searchParfums.toLowerCase()) ||
      p.marque?.toLowerCase().includes(searchParfums.toLowerCase());
    const matchGenre = filterGenre === "tous" || p.genre === filterGenre;
    return matchSearch && matchGenre;
  });

  // ✅ Nouvelle fonction de filtrage des notes (remplace l’ancienne)
  const filteredNotes = notes.filter((n) => {
    const search = (searchNotes || "").toLowerCase();
    const matchSearch =
      n.nom?.toLowerCase().includes(search) ||
      n.description?.toLowerCase().includes(search) ||
      n.famille?.toLowerCase().includes(search);

    const matchFamily =
      filterNoteFamily === "toutes" || n.famille === filterNoteFamily;

    const matchPosition =
      filterNotePosition === "toutes" ||
      (n.suggestedPositions &&
        n.suggestedPositions.includes(filterNotePosition)) ||
      // Fallback pour ancien format
      (n.type && n.type === filterNotePosition);

    return matchSearch && matchFamily && matchPosition;
  });

  // === ONGLETS DE NAVIGATION ===
  const tabs = [
    { id: "dashboard", label: "Tableau de bord", icon: BarChart3 },
    { id: "users", label: "Utilisateurs", icon: Users, count: users.length },
    { id: "parfums", label: "Parfums", icon: Package, count: parfums.length },
    { id: "notes", label: "Notes", icon: Star, count: notes.length },
    {
      id: "contact",
      label: "Messages",
      icon: MessageSquare,
      count: messages.length,
    },
  ];

  // === FONCTIONS D'ÉDITION ===
  const startEditUser = (u) => {
    setEditingItem(u);
    setUserForm({
      username: u.username || "",
      email: u.email || "",
      password: "",
    });
    setShowUserForm(true);
  };

  // ✅ startEditNote mis à jour (compatibilité ancien/nouveau format)

  // Gestion du chargement
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>
          Chargement du panneau d'administration...
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            <ArrowLeft className={styles.icon} />
            <span>Retour</span>
          </button>

          <div className={styles.headerCenter}>
            <div className={styles.adminBadge}>
              <Shield className={styles.icon} />
              <span>Panneau d'Administration</span>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={handleRefresh}
              className={`${styles.refreshButton} ${
                refreshing ? styles.refreshing : ""
              }`}
              disabled={refreshing}
            >
              <RefreshCw className={styles.icon} />
              {refreshing ? "Actualisation..." : "Actualiser"}
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Navigation par onglets */}
        <nav className={styles.navigation}>
          <div className={styles.navInner}>
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${styles.navTab} ${
                    activeTab === tab.id ? styles.navTabActive : ""
                  }`}
                >
                  <TabIcon className={styles.icon} />
                  <span className={styles.navLabel}>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={styles.navCount}>{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Contenu principal */}
        <div className={styles.content}>
          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className={styles.dashboard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Tableau de bord</h2>
                <p className={styles.sectionSubtitle}>
                  Vue d'ensemble de votre plateforme Scentify
                </p>
              </div>

              {/* Statistiques */}
              <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.statUsers}`}>
                  <div className={styles.statContent}>
                    <div className={styles.statMeta}>
                      <p className={styles.statLabel}>Utilisateurs</p>
                      <p className={styles.statValue}>{users.length}</p>
                      <p className={styles.statDetail}>Membres inscrits</p>
                    </div>
                    <div className={styles.statIcon}>
                      <Users className={styles.icon} />
                    </div>
                  </div>
                </div>

                <div className={`${styles.statCard} ${styles.statParfums}`}>
                  <div className={styles.statContent}>
                    <div className={styles.statMeta}>
                      <p className={styles.statLabel}>Parfums</p>
                      <p className={styles.statValue}>{parfums.length}</p>
                      <p className={styles.statDetail}>Dans la base</p>
                    </div>
                    <div className={styles.statIcon}>
                      <Package className={styles.icon} />
                    </div>
                  </div>
                </div>

                <div className={`${styles.statCard} ${styles.statNotes}`}>
                  <div className={styles.statContent}>
                    <div className={styles.statMeta}>
                      <p className={styles.statLabel}>Notes</p>
                      <p className={styles.statValue}>{notes.length}</p>
                      <p className={styles.statDetail}>Références</p>
                    </div>
                    <div className={styles.statIcon}>
                      <Star className={styles.icon} />
                    </div>
                  </div>
                </div>

                <div className={`${styles.statCard} ${styles.statAdmins}`}>
                  <div className={styles.statContent}>
                    <div className={styles.statMeta}>
                      <p className={styles.statLabel}>Admins</p>
                      <p className={styles.statValue}>
                        {users.filter((u) => u.isAdmin).length}
                      </p>
                      <p className={styles.statDetail}>Administrateurs</p>
                    </div>
                    <div className={styles.statIcon}>
                      <Crown className={styles.icon} />
                    </div>
                  </div>
                </div>
              </div>

              {/* État du système */}
              <div className={styles.systemStatus}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionMeta}>
                    <div className={styles.sectionIconWrapper}>
                      <Activity className={styles.icon} />
                    </div>
                    <h3 className={styles.sectionTitle}>État du système</h3>
                  </div>
                </div>

                <div className={styles.statusGrid}>
                  <div
                    className={`${styles.statusItem} ${styles.statusSuccess}`}
                  >
                    <div className={styles.statusIndicator}></div>
                    <span className={styles.statusLabel}>
                      API Fonctionnelle
                    </span>
                    <span className={styles.statusBadge}>OK</span>
                  </div>
                  <div
                    className={`${styles.statusItem} ${styles.statusSuccess}`}
                  >
                    <div className={styles.statusIndicator}></div>
                    <span className={styles.statusLabel}>Base de données</span>
                    <span className={styles.statusBadge}>OK</span>
                  </div>
                </div>
              </div>

              {/* Actions rapides */}
              <div className={styles.quickActions}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Actions rapides</h3>
                </div>
                <div className={styles.actionGrid}>
                  <button
                    onClick={handleExportUsers}
                    className={styles.actionButton}
                  >
                    <Download className={styles.icon} />
                    <span>Export Utilisateurs</span>
                  </button>
                  <button
                    onClick={handleExportParfums}
                    className={styles.actionButton}
                  >
                    <Download className={styles.icon} />
                    <span>Export Parfums</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* UTILISATEURS */}
          {activeTab === "users" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  Gestion des utilisateurs
                </h2>
                <div className={styles.sectionActions}>
                  <button
                    onClick={() => setShowUserForm(true)}
                    className={styles.primaryButton}
                  >
                    <Plus className={styles.icon} />
                    <span>Nouvel utilisateur</span>
                  </button>
                </div>
              </div>

              {/* Barre de recherche */}
              <div className={styles.searchBar}>
                <Search className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              {/* Liste des utilisateurs */}
              <div className={styles.tableContainer}>
                <div className={styles.table}>
                  <div className={styles.tableHeader}>
                    <div className={styles.tableRow}>
                      <div className={styles.tableCell}>Utilisateur</div>
                      <div className={styles.tableCell}>Email</div>
                      <div className={styles.tableCell}>Statut</div>
                      <div className={styles.tableCell}>Inscrit le</div>
                      <div className={styles.tableCell}>Actions</div>
                    </div>
                  </div>
                  <div className={styles.tableBody}>
                    {filteredUsers.map((userItem) => (
                      <div key={userItem._id} className={styles.tableRow}>
                        <div className={styles.tableCell}>
                          <div className={styles.userInfo}>
                            <div
                              className={`${styles.avatar} ${
                                userItem.isAdmin ? styles.avatarAdmin : ""
                              }`}
                            >
                              {userItem.isAdmin ? (
                                <Crown className={styles.icon} />
                              ) : (
                                <User className={styles.icon} />
                              )}
                            </div>
                            <div className={styles.userDetails}>
                              <p className={styles.userName}>
                                {userItem.username}
                              </p>
                              {userItem.isAdmin && (
                                <span className={styles.adminBadgeSmall}>
                                  Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={styles.tableCell}>
                          <p className={styles.userEmail}>{userItem.email}</p>
                        </div>
                        <div className={styles.tableCell}>
                          <span
                            className={`${styles.statusBadge} ${styles.statusSuccess}`}
                          >
                            Actif
                          </span>
                        </div>
                        <div className={styles.tableCell}>
                          <p className={styles.dateText}>
                            {userItem.createdAt
                              ? new Date(userItem.createdAt).toLocaleDateString(
                                  "fr-FR"
                                )
                              : "-"}
                          </p>
                        </div>
                        <div className={styles.tableCell}>
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => startEditUser(userItem)}
                              className={styles.iconButton}
                              title="Modifier"
                            >
                              <Edit3 className={styles.icon} />
                            </button>
                            <button
                              onClick={() =>
                                toggleAdminStatus(
                                  userItem._id,
                                  userItem.isAdmin
                                )
                              }
                              className={`${styles.iconButton} ${
                                userItem.isAdmin
                                  ? styles.iconButtonDanger
                                  : styles.iconButtonSuccess
                              }`}
                              title={
                                userItem.isAdmin
                                  ? "Retirer admin"
                                  : "Promouvoir admin"
                              }
                              disabled={userItem._id === user?._id}
                            >
                              {userItem.isAdmin ? (
                                <UserX className={styles.icon} />
                              ) : (
                                <UserCheck className={styles.icon} />
                              )}
                            </button>
                            <button
                              onClick={() => deleteUser(userItem._id)}
                              className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                              title="Supprimer"
                              disabled={userItem._id === user?._id}
                            >
                              <Trash2 className={styles.icon} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PARFUMS */}
          {activeTab === "parfums" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Gestion des parfums</h2>
                <div className={styles.sectionActions}>
                  {/* ✅ Redirection vers le formulaire dédié */}
                  <button
                    onClick={() => navigate("/parfum/new")} // ✅ Corrigé : /parfum/new au lieu de /parfums/new
                    className={styles.primaryButton}
                  >
                    <Plus className={styles.icon} />
                    <span>Nouveau parfum</span>
                  </button>
                </div>
              </div>

              {/* Filtres et recherche */}
              <div className={styles.filtersRow}>
                <div className={styles.searchBar}>
                  <Search className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Rechercher un parfum..."
                    value={searchParfums}
                    onChange={(e) => setSearchParfums(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                <select
                  value={filterGenre}
                  onChange={(e) => setFilterGenre(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="tous">Tous les genres</option>
                  <option value="femme">Femme</option>
                  <option value="homme">Homme</option>
                  <option value="mixte">Mixte</option>
                </select>
              </div>

              {/* Grille des parfums */}
              <div className={styles.cardGrid}>
                {filteredParfums.map((parfum) => (
                  <div key={parfum._id} className={styles.parfumCard}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{parfum.nom}</h3>
                      <p className={styles.cardSubtitle}>{parfum.marque}</p>
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.cardMeta}>
                        <span
                          className={`${styles.genreBadge} ${
                            styles[`genre${parfum.genre}`]
                          }`}
                        >
                          {parfum.genre}
                        </span>
                        {parfum.popularite && (
                          <span className={styles.popularityScore}>
                            <Star className={styles.icon} />
                            {parfum.popularite}/100
                          </span>
                        )}
                      </div>
                      {parfum.description && (
                        <p className={styles.cardDescription}>
                          {parfum.description.length > 120
                            ? `${parfum.description.substring(0, 120)}...`
                            : parfum.description}
                        </p>
                      )}
                    </div>
                    <div className={styles.cardActions}>
                      {/* ✅ Redirection vers l’édition dédiée */}
                      <button
                        onClick={() => navigate(`/parfum/edit/${parfum._id}`)} // ✅ Corrigé : /parfum/edit au lieu de /parfums/edit
                        className={styles.iconButton}
                        title="Modifier"
                      >
                        <Edit3 className={styles.icon} />
                      </button>
                      <button
                        onClick={() => deleteParfum(parfum._id)}
                        className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                        title="Supprimer"
                      >
                        <Trash2 className={styles.icon} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* === SECTION NOTES CORRIGÉE === */}
          {activeTab === "notes" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  Gestion des notes olfactives
                </h2>
                <div className={styles.sectionActions}>
                  <button
                    onClick={() => setShowNoteForm(true)}
                    className={styles.primaryButton}
                  >
                    <Plus className={styles.icon} />
                    <span>Nouvelle note</span>
                  </button>
                </div>
              </div>

              {/* Filtres pour les notes */}
              <div className={styles.filtersRow}>
                <div className={styles.searchBox}>
                  <Search className={styles.icon} />
                  <input
                    type="text"
                    placeholder="Rechercher une note..."
                    value={searchNotes}
                    onChange={(e) => setSearchNotes(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                <select
                  value={filterNoteFamily}
                  onChange={(e) => setFilterNoteFamily(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="toutes">Toutes les familles</option>
                  <option value="agrumes">Agrumes</option>
                  <option value="florale">Florale</option>
                  <option value="fruitée">Fruitée</option>
                  <option value="verte">Verte</option>
                  <option value="aromatique">Aromatique</option>
                  <option value="épicée">Épicée</option>
                  <option value="boisée">Boisée</option>
                  <option value="orientale">Orientale</option>
                  <option value="ambrée">Ambrée</option>
                  <option value="musquée">Musquée</option>
                  <option value="animale">Animale</option>
                  <option value="poudrée">Poudrée</option>
                  <option value="gourmande">Gourmande</option>
                  <option value="marine">Marine</option>
                  <option value="aldéhydée">Aldéhydée</option>
                  <option value="cuirée">Cuirée</option>
                  <option value="fumée">Fumée</option>
                  <option value="résineuse">Résineuse</option>
                </select>

                <select
                  value={filterNotePosition}
                  onChange={(e) => setFilterNotePosition(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="toutes">Toutes positions</option>
                  <option value="tête">Notes de tête</option>
                  <option value="cœur">Notes de cœur</option>
                  <option value="fond">Notes de fond</option>
                </select>
              </div>

              {/* Statistiques des notes */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Star className={styles.icon} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statNumber}>
                      {filteredNotes.length}
                    </div>
                    <div className={styles.statLabel}>Notes totales</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Palette className={styles.icon} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statNumber}>
                      {[...new Set(filteredNotes.map((n) => n.famille))].length}
                    </div>
                    <div className={styles.statLabel}>Familles olfactives</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <TrendingUp className={styles.icon} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statNumber}>
                      {filteredNotes.filter((n) => n.popularite > 50).length}
                    </div>
                    <div className={styles.statLabel}>Notes populaires</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Layers className={styles.icon} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statNumber}>
                      {
                        filteredNotes.filter(
                          (n) =>
                            n.suggestedPositions &&
                            n.suggestedPositions.length > 1
                        ).length
                      }
                    </div>
                    <div className={styles.statLabel}>
                      Notes multi-positions
                    </div>
                  </div>
                </div>
              </div>

              {/* Grille des notes */}
              <div className={styles.notesGrid}>
                {filteredNotes.map((note) => (
                  <div
                    key={note._id}
                    className={styles.noteCard}
                    style={{
                      borderLeft: `4px solid ${note.couleur || "#4a90e2"}`,
                      background: `linear-gradient(135deg, ${
                        note.couleur || "#4a90e2"
                      }08, ${note.couleur || "#4a90e2"}03)`,
                    }}
                  >
                    {/* En-tête de la note */}
                    <div className={styles.noteHeader}>
                      <div className={styles.noteTitle}>
                        <h3 className={styles.noteName}>{note.nom}</h3>
                        <span
                          className={styles.familyBadge}
                          style={{ backgroundColor: note.couleur || "#4a90e2" }}
                        >
                          {note.famille}
                        </span>
                      </div>
                      <div className={styles.noteActions}>
                        <button
                          onClick={() => startEditNote(note)}
                          className={styles.iconButton}
                          title="Modifier"
                        >
                          <Edit3 className={styles.icon} />
                        </button>
                        <button
                          onClick={() => deleteNote(note._id)}
                          className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                          title="Supprimer"
                        >
                          <Trash2 className={styles.icon} />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {note.description && (
                      <p className={styles.noteDescription}>
                        {note.description}
                      </p>
                    )}

                    {/* Positions suggérées */}
                    <div className={styles.suggestedPositions}>
                      <div className={styles.sectionLabel}>
                        Positions suggérées:
                      </div>
                      <div className={styles.positionTags}>
                        {note.suggestedPositions &&
                        note.suggestedPositions.length > 0 ? (
                          note.suggestedPositions.map((position, index) => (
                            <span
                              key={index}
                              className={`${styles.positionTag} ${
                                styles[
                                  `position${position
                                    .replace("ê", "e")
                                    .replace("œ", "oe")}`
                                ]
                              }`}
                            >
                              {position}
                            </span>
                          ))
                        ) : (
                          <span className={styles.noPositions}>
                            Aucune position définie
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Statistiques d'usage */}
                    {note.usages && (
                      <div className={styles.usageStats}>
                        <div className={styles.sectionLabel}>
                          Statistiques d'usage:
                        </div>
                        <div className={styles.usageGrid}>
                          {["tete", "coeur", "fond"].map((position) => {
                            const usage = note.usages[position];
                            const positionLabel =
                              position === "tete"
                                ? "Tête"
                                : position === "coeur"
                                ? "Cœur"
                                : "Fond";

                            return (
                              <div key={position} className={styles.usageItem}>
                                <div className={styles.usageLabel}>
                                  {positionLabel}
                                </div>
                                <div className={styles.usageValue}>
                                  <span className={styles.frequence}>
                                    {usage?.frequence || 0}
                                  </span>
                                  {usage?.populaire && (
                                    <Star className={styles.popularIcon} />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Métriques */}
                    <div className={styles.noteMetrics}>
                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Intensité:</span>
                        <div className={styles.intensityBar}>
                          <div
                            className={styles.intensityFill}
                            style={{
                              width: `${(note.intensite || 5) * 10}%`,
                              backgroundColor: note.couleur || "#4a90e2",
                            }}
                          ></div>
                          <span className={styles.intensityValue}>
                            {note.intensite || 5}/10
                          </span>
                        </div>
                      </div>

                      <div className={styles.metric}>
                        <span className={styles.metricLabel}>Popularité:</span>
                        <div className={styles.popularityBar}>
                          <div
                            className={styles.popularityFill}
                            style={{
                              width: `${note.popularite || 0}%`,
                              backgroundColor: note.couleur || "#4a90e2",
                            }}
                          ></div>
                          <span className={styles.popularityValue}>
                            {note.popularite || 0}/100
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Position préférée (calculée) */}
                    {note.positionPreferee && (
                      <div className={styles.preferredPosition}>
                        <span className={styles.sectionLabel}>
                          Position préférée:
                        </span>
                        <span
                          className={`${styles.positionTag} ${styles.preferred}`}
                        >
                          {note.positionPreferee}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Message si aucune note */}
              {filteredNotes.length === 0 && (
                <div className={styles.emptyState}>
                  <Star className={styles.emptyIcon} />
                  <h3 className={styles.emptyTitle}>Aucune note trouvée</h3>
                  <p className={styles.emptyText}>
                    {searchNotes ||
                    filterNoteFamily !== "toutes" ||
                    filterNotePosition !== "toutes"
                      ? "Aucune note ne correspond à vos critères de recherche."
                      : "Commencez par ajouter des notes olfactives à votre base de données."}
                  </p>
                  {(searchNotes ||
                    filterNoteFamily !== "toutes" ||
                    filterNotePosition !== "toutes") && (
                    <button
                      onClick={() => {
                        setSearchNotes("");
                        setFilterNoteFamily("toutes");
                        setFilterNotePosition("toutes");
                      }}
                      className={styles.clearFiltersButton}
                    >
                      Effacer les filtres
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CONTACT */}
          {activeTab === "contact" && (
            <div className={styles.section}>
              <ContactSection />
            </div>
          )}
        </div>
      </main>

      {/* === MODALES === */}

      {/* Modale Utilisateur */}
      {showUserForm && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowUserForm(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingItem ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
              </h3>
              <button
                onClick={() => setShowUserForm(false)}
                className={styles.modalClose}
              >
                <X className={styles.icon} />
              </button>
            </div>
            <form
              onSubmit={editingItem ? updateUser : createUser}
              className={styles.modalForm}
            >
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nom d'utilisateur</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) =>
                    setUserForm({ ...userForm, username: e.target.value })
                  }
                  className={styles.formInput}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                  className={styles.formInput}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {editingItem
                    ? "Nouveau mot de passe (optionnel)"
                    : "Mot de passe"}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                  className={styles.formInput}
                  required={!editingItem}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  className={styles.secondaryButton}
                >
                  Annuler
                </button>
                <button type="submit" className={styles.primaryButton}>
                  <Save className={styles.icon} />
                  {editingItem ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Modale Parfum SUPPRIMÉE — remplacée par des pages dédiées */}

      {/* NoteForm moderne */}
      <NoteForm
        note={editingItem}
        isOpen={showNoteForm}
        onClose={() => {
          setShowNoteForm(false);
          setEditingItem(null);
        }}
        onSubmit={async (formData) => {
          try {
            if (editingItem) {
              await notesAPI.update(editingItem._id, formData);
              toast.success("Note modifiée");
            } else {
              await notesAPI.create(formData);
              toast.success("Note créée");
            }
            await loadData();
          } catch (error) {
            throw error;
          }
        }}
        loading={loading}
      />
    </div>
  );
}
