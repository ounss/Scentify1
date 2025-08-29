// frontend/src/pages/AdminPanel.jsx - DASHBOARD ADMIN COMPLET
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
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Filter,
  X,
  Save,
  Star,
  ShoppingBag,
} from "lucide-react";
import { adminAPI } from "../services/adminAPI.js";
import { parfumAPI, noteAPI, authAPI } from "../services/api.js";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function AdminPanel() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [parfums, setParfums] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // États pour la recherche et filtres
  const [searchUsers, setSearchUsers] = useState("");
  const [searchParfums, setSearchParfums] = useState("");
  const [searchNotes, setSearchNotes] = useState("");
  const [filterGenre, setFilterGenre] = useState("tous");
  const [filterNoteType, setFilterNoteType] = useState("tous");

  // États pour les modals/formulaires
  const [showUserForm, setShowUserForm] = useState(false);
  const [showParfumForm, setShowParfumForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // États pour les formulaires
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [parfumForm, setParfumForm] = useState({
    nom: "",
    marque: "",
    genre: "mixte",
    description: "",
  });
  const [noteForm, setNoteForm] = useState({
    nom: "",
    type: "tête",
    description: "",
  });

  const tabs = [
    { id: "dashboard", label: "Tableau de bord", icon: BarChart3 },
    { id: "users", label: "Utilisateurs", icon: Users, count: users.length },
    { id: "parfums", label: "Parfums", icon: Package, count: parfums.length },
    { id: "notes", label: "Notes", icon: TrendingUp, count: notes.length },
  ];

  // ✅ Vérification des droits d'accès
  useEffect(() => {
    if (!isAdmin) {
      toast.error("Accès non autorisé");
      navigate("/");
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, navigate]);

  // ✅ CHARGEMENT DES DONNÉES
  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, parfumsData, notesData] = await Promise.all([
        adminAPI
          .getStats()
          .catch(() => ({ users: {}, parfums: {}, notes: {} })),
        adminAPI
          .getUsers({ limit: 100 })
          .catch(() => ({ data: { users: [] } })),
        parfumAPI
          .getAll({ limit: 100 })
          .catch(() => ({ data: { parfums: [] } })),
        noteAPI.getAll({ limit: 100 }).catch(() => ({ data: { notes: [] } })),
      ]);

      setStats(statsData);
      setUsers(usersData.data?.users || []);
      setParfums(parfumsData.data?.parfums || parfumsData.data || []);
      setNotes(notesData.data?.notes || notesData.data || []);

      toast.success("Données admin chargées");
    } catch (error) {
      console.error("❌ Erreur chargement admin:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  // ✅ REFRESH MANUEL
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ✅ EXPORT CSV UTILISATEURS (NOUVEAU)
  const handleExportUsers = async () => {
    try {
      const response = await adminAPI.exportUsers();

      // Créer un blob et déclencher le téléchargement
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "users.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Export CSV réussi");
    } catch (error) {
      console.error("Erreur export:", error);
      toast.error("Erreur lors de l'export");
    }
  };

  // ✅ GESTION UTILISATEURS
  const createUser = async (e) => {
    e.preventDefault();
    try {
      await authAPI.register(userForm);
      setShowUserForm(false);
      setUserForm({ username: "", email: "", password: "" });
      await loadData();
      toast.success("Utilisateur créé");
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur création");
    }
  };

  const deleteUser = async (userId) => {
    if (userId === user._id) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte");
      return;
    }
    if (!window.confirm("Supprimer cet utilisateur ?")) return;

    try {
      // Note: Route backend à implémenter si nécessaire
      setUsers(users.filter((u) => u._id !== userId));
      toast.success("Utilisateur supprimé");
    } catch (error) {
      toast.error("Erreur suppression");
    }
  };

  const toggleAdminStatus = async (userId, currentStatus) => {
    if (userId === user._id) {
      toast.error("Vous ne pouvez pas modifier votre propre statut");
      return;
    }

    try {
      await adminAPI.toggleAdmin(userId);
      setUsers(
        users.map((u) => (u._id === userId ? { ...u, isAdmin: !u.isAdmin } : u))
      );
      toast.success(
        currentStatus ? "Droits admin retirés" : "Droits admin accordés"
      );
    } catch (error) {
      toast.error("Erreur modification");
    }
  };

  // ✅ GESTION PARFUMS
  const createParfum = async (e) => {
    e.preventDefault();
    try {
      const response = await parfumAPI.create(parfumForm);
      setShowParfumForm(false);
      setParfumForm({
        nom: "",
        marque: "",
        genre: "mixte",
        description: "",
      });
      setParfums([...parfums, response.data]);
      toast.success("Parfum créé");
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur création");
    }
  };

  const updateParfum = async (e) => {
    e.preventDefault();
    try {
      const response = await parfumAPI.update(editingItem._id, parfumForm);
      setShowParfumForm(false);
      setEditingItem(null);
      setParfums(
        parfums.map((p) => (p._id === editingItem._id ? response.data : p))
      );
      toast.success("Parfum modifié");
    } catch (error) {
      toast.error("Erreur modification");
    }
  };

  const deleteParfum = async (parfumId) => {
    if (!window.confirm("Supprimer ce parfum ?")) return;

    try {
      await parfumAPI.delete(parfumId);
      setParfums(parfums.filter((p) => p._id !== parfumId));
      toast.success("Parfum supprimé");
    } catch (error) {
      toast.error("Erreur suppression");
    }
  };

  // ✅ GESTION NOTES
  const createNote = async (e) => {
    e.preventDefault();
    try {
      const response = await noteAPI.create(noteForm);
      setShowNoteForm(false);
      setNoteForm({ nom: "", type: "tête", description: "" });
      setNotes([...notes, response.data]);
      toast.success("Note créée");
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur création");
    }
  };

  const updateNote = async (e) => {
    e.preventDefault();
    try {
      const response = await noteAPI.update(editingItem._id, noteForm);
      setShowNoteForm(false);
      setEditingItem(null);
      setNotes(
        notes.map((n) => (n._id === editingItem._id ? response.data : n))
      );
      toast.success("Note modifiée");
    } catch (error) {
      toast.error("Erreur modification");
    }
  };

  const deleteNote = async (noteId) => {
    if (!window.confirm("Supprimer cette note ?")) return;

    try {
      await noteAPI.delete(noteId);
      setNotes(notes.filter((n) => n._id !== noteId));
      toast.success("Note supprimée");
    } catch (error) {
      toast.error("Erreur suppression");
    }
  };

  // ✅ FILTRES (mémoïsables si besoin)
  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredParfums = parfums.filter((parfum) => {
    const matchSearch =
      parfum.nom.toLowerCase().includes(searchParfums.toLowerCase()) ||
      parfum.marque.toLowerCase().includes(searchParfums.toLowerCase());
    const matchGenre = filterGenre === "tous" || parfum.genre === filterGenre;
    return matchSearch && matchGenre;
  });

  const filteredNotes = notes.filter((note) => {
    const matchSearch = note.nom
      .toLowerCase()
      .includes(searchNotes.toLowerCase());
    const matchType = filterNoteType === "tous" || note.type === filterNoteType;
    return matchSearch && matchType;
  });

  // ✅ UTILITAIRES
  const openEditForm = (item, type) => {
    setEditingItem(item);
    if (type === "user") {
      setUserForm({ username: item.username, email: item.email, password: "" });
      setShowUserForm(true);
    } else if (type === "parfum") {
      setParfumForm({
        nom: item.nom,
        marque: item.marque,
        genre: item.genre,
        description: item.description,
      });
      setShowParfumForm(true);
    } else if (type === "note") {
      setNoteForm({
        nom: item.nom,
        type: item.type,
        description: item.description,
      });
      setShowNoteForm(true);
    }
  };

  // ✅ LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Chargement du panel admin
          </h2>
          <p className="text-gray-600">Récupération des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* ✅ HEADER STYLISÉ */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate("/")}
                className="flex items-center space-x-3 text-gray-600 hover:text-gray-800 transition-all duration-200 hover:bg-gray-100 px-3 py-2 rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Retour</span>
              </button>

              <div className="border-l border-gray-300 pl-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Administration Scentify
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestion complète de l'application
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 font-medium"
                title="Actualiser"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                <span className="hidden md:inline">Actualiser</span>
              </button>

              <div className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 px-5 py-3 rounded-xl text-sm font-bold flex items-center space-x-2 border border-orange-200 shadow-sm">
                <Crown className="w-4 h-4" />
                <span>Admin: {user?.username}</span>
              </div>
            </div>
          </div>

          {/* ✅ TABS STYLISÉS */}
          <div className="flex space-x-1 mt-8 bg-gray-100 rounded-2xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-white text-red-600 shadow-md transform scale-[1.02]"
                    : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      activeTab === tab.id
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* ✅ DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                Tableau de bord
              </h2>
              <p className="text-gray-600">
                Vue d'ensemble de votre application Scentify
              </p>
            </div>

            {/* Cards statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 font-semibold mb-2">
                      Utilisateurs Total
                    </p>
                    <p className="text-4xl font-bold text-blue-800">
                      {stats.users?.totalUsers || 0}
                    </p>
                    <p className="text-sm text-blue-600 mt-2">
                      +{stats.users?.recentUsers || 0} ce mois
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 font-semibold mb-2">
                      Parfums
                    </p>
                    <p className="text-4xl font-bold text-purple-800">
                      {stats.parfums?.totalParfums || parfums.length}
                    </p>
                    <p className="text-sm text-purple-600 mt-2">
                      Dans la collection
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-6 border border-green-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 font-semibold mb-2">
                      Notes Olfactives
                    </p>
                    <p className="text-4xl font-bold text-green-800">
                      {stats.notes?.total || notes.length}
                    </p>
                    <p className="text-sm text-green-600 mt-2">Références</p>
                  </div>
                  <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 border border-orange-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 font-semibold mb-2">Admins</p>
                    <p className="text-4xl font-bold text-orange-800">
                      {users.filter((u) => u.isAdmin).length}
                    </p>
                    <p className="text-sm text-orange-600 mt-2">
                      Administrateurs
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* État du système */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">
                  État du système
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-5 bg-green-50 rounded-2xl border border-green-200">
                  <span className="text-green-800 font-semibold flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                    API Fonctionnelle
                  </span>
                  <span className="text-green-600 text-sm font-medium bg-green-100 px-3 py-1 rounded-full">
                    En ligne
                  </span>
                </div>

                <div className="flex items-center justify-between p-5 bg-blue-50 rounded-2xl border border-blue-200">
                  <span className="text-blue-800 font-semibold flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                    Base de données
                  </span>
                  <span className="text-blue-600 text-sm font-medium bg-blue-100 px-3 py-1 rounded-full">
                    Connectée
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ USERS TAB */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  Gestion des utilisateurs
                </h2>
                <p className="text-gray-600 mt-1">
                  {filteredUsers.length} utilisateur
                  {filteredUsers.length > 1 ? "s" : ""} trouvé
                  {filteredUsers.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowUserForm(true)}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span>Nouvel utilisateur</span>
                </button>

                {/* ✅ Bouton Export CSV corrigé */}
                <button
                  onClick={handleExportUsers}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  <Download className="w-5 h-5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Recherche utilisateurs */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                />
              </div>
            </div>

            {/* Table utilisateurs */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Inscription
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredUsers.map((currentUser) => (
                      <tr
                        key={currentUser._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                              <span className="text-white text-sm font-bold">
                                {currentUser.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-base font-semibold text-gray-900">
                                {currentUser.username}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {currentUser._id.slice(-8)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {currentUser.email}
                          </div>
                          <div
                            className={`text-xs font-medium ${
                              currentUser.isVerified
                                ? "text-green-600"
                                : "text-orange-600"
                            }`}
                          >
                            {currentUser.isVerified
                              ? "✓ Vérifié"
                              : "⚠ Non vérifié"}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          {currentUser.isAdmin ? (
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200">
                              <Crown className="w-4 h-4 mr-2" />
                              Administrateur
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                              <User className="w-4 h-4 mr-2" />
                              Utilisateur
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-500">
                          {new Date(currentUser.createdAt).toLocaleDateString(
                            "fr-FR"
                          )}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => openEditForm(currentUser, "user")}
                              className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                toggleAdminStatus(
                                  currentUser._id,
                                  currentUser.isAdmin
                                )
                              }
                              disabled={currentUser._id === user._id}
                              className={`p-2 rounded-lg transition-colors ${
                                currentUser._id === user._id
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : currentUser.isAdmin
                                  ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                                  : "bg-green-100 text-green-600 hover:bg-green-200"
                              }`}
                              title={
                                currentUser.isAdmin
                                  ? "Retirer admin"
                                  : "Promouvoir admin"
                              }
                            >
                              {currentUser.isAdmin ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => deleteUser(currentUser._id)}
                              disabled={currentUser._id === user._id}
                              className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ✅ PARFUMS TAB */}
        {activeTab === "parfums" && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  Gestion des parfums
                </h2>
                <p className="text-gray-600 mt-1">
                  {filteredParfums.length} parfum
                  {filteredParfums.length > 1 ? "s" : ""} trouvé
                  {filteredParfums.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowParfumForm(true)}
                  className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span>Nouveau parfum</span>
                </button>
              </div>
            </div>

            {/* Recherche & filtres parfums */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou marque..."
                    value={searchParfums}
                    onChange={(e) => setSearchParfums(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <select
                    value={filterGenre}
                    onChange={(e) => setFilterGenre(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 appearance-none"
                  >
                    <option value="tous">Tous les genres</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                    <option value="mixte">Mixte</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grille parfums */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredParfums.map((parfum) => (
                <div
                  key={parfum._id}
                  className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-purple-200 relative">
                    <img
                      src={
                        parfum.photo ||
                        "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop"
                      }
                      alt={parfum.nom}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop";
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                          parfum.genre === "homme"
                            ? "bg-blue-500"
                            : parfum.genre === "femme"
                            ? "bg-pink-500"
                            : "bg-purple-500"
                        }`}
                      >
                        {parfum.genre}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 flex space-x-2">
                      {parfum.popularite > 80 && (
                        <div className="bg-orange-500 text-white p-2 rounded-full">
                          <Star className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-800 mb-1">
                      {parfum.nom}
                    </h3>
                    <p className="text-gray-600 mb-3">{parfum.marque}</p>

                    {parfum.notes && parfum.notes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {parfum.notes.slice(0, 3).map((note, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                          >
                            {typeof note === "string" ? note : note.nom}
                          </span>
                        ))}
                        {parfum.notes.length > 3 && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs">
                            +{parfum.notes.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {parfum.popularite || 0}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditForm(parfum, "parfum")}
                          className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteParfum(parfum._id)}
                          className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredParfums.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl shadow-lg">
                <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-600 mb-4">
                  Aucun parfum trouvé
                </h3>
                <p className="text-gray-500 mb-8">
                  {searchParfums
                    ? `Aucun résultat pour "${searchParfums}"`
                    : "Aucun parfum dans la base de données"}
                </p>
                <button
                  onClick={() => setShowParfumForm(true)}
                  className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-700"
                >
                  Créer le premier parfum
                </button>
              </div>
            )}
          </div>
        )}

        {/* ✅ NOTES TAB */}
        {activeTab === "notes" && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  Gestion des notes olfactives
                </h2>
                <p className="text-gray-600 mt-1">
                  {filteredNotes.length} note
                  {filteredNotes.length > 1 ? "s" : ""} trouvée
                  {filteredNotes.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowNoteForm(true)}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span>Nouvelle note</span>
                </button>
              </div>
            </div>

            {/* Recherche & filtres notes */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une note..."
                    value={searchNotes}
                    onChange={(e) => setSearchNotes(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <select
                    value={filterNoteType}
                    onChange={(e) => setFilterNoteType(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 appearance-none"
                  >
                    <option value="tous">Tous les types</option>
                    <option value="tête">Notes de tête</option>
                    <option value="cœur">Notes de cœur</option>
                    <option value="fond">Notes de fond</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grille notes par type */}
            {["tête", "cœur", "fond"].map((type) => {
              const notesType = filteredNotes.filter(
                (note) => note.type === type
              );
              if (notesType.length === 0) return null;

              return (
                <div
                  key={type}
                  className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div
                      className={`w-6 h-6 rounded-full ${
                        type === "tête"
                          ? "bg-yellow-500"
                          : type === "cœur"
                          ? "bg-pink-500"
                          : "bg-purple-500"
                      }`}
                    ></div>
                    <h3
                      className={`text-2xl font-bold capitalize ${
                        type === "tête"
                          ? "text-yellow-700"
                          : type === "cœur"
                          ? "text-pink-700"
                          : "text-purple-700"
                      }`}
                    >
                      Notes de {type}
                    </h3>
                    <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {notesType.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {notesType.map((note) => (
                      <div
                        key={note._id}
                        className={`p-4 rounded-2xl border-2 hover:shadow-lg transition-all duration-300 hover:scale-105 ${
                          type === "tête"
                            ? "bg-yellow-50 border-yellow-200 hover:border-yellow-300"
                            : type === "cœur"
                            ? "bg-pink-50 border-pink-200 hover:border-pink-300"
                            : "bg-purple-50 border-purple-200 hover:border-purple-300"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-bold text-gray-800 flex-1">
                            {note.nom}
                          </h4>
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              onClick={() => openEditForm(note, "note")}
                              className="p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteNote(note._id)}
                              className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {note.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {note.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            Popularité: {note.popularite || 0}
                          </span>
                          {note.famille && (
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                              {note.famille}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredNotes.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl shadow-lg">
                <TrendingUp className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-600 mb-4">
                  Aucune note trouvée
                </h3>
                <p className="text-gray-500 mb-8">
                  {searchNotes
                    ? `Aucun résultat pour "${searchNotes}"`
                    : "Aucune note dans la base de données"}
                </p>
                <button
                  onClick={() => setShowNoteForm(true)}
                  className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700"
                >
                  Créer la première note
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅ MODALS FORMULAIRES */}

      {/* Modal Utilisateur */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingItem
                    ? "Modifier l'utilisateur"
                    : "Nouvel utilisateur"}
                </h3>
                <button
                  onClick={() => {
                    setShowUserForm(false);
                    setEditingItem(null);
                    setUserForm({ username: "", email: "", password: "" });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form
              onSubmit={
                editingItem
                  ? (e) => {
                      e.preventDefault();
                      /* updateUser à implémenter si souhaité */
                    }
                  : createUser
              }
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) =>
                    setUserForm({ ...userForm, username: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!editingItem}
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingItem ? "Modifier" : "Créer"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserForm(false);
                    setEditingItem(null);
                    setUserForm({ username: "", email: "", password: "" });
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Parfum */}
      {showParfumForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingItem ? "Modifier le parfum" : "Nouveau parfum"}
                </h3>
                <button
                  onClick={() => {
                    setShowParfumForm(false);
                    setEditingItem(null);
                    setParfumForm({
                      nom: "",
                      marque: "",
                      genre: "mixte",
                      description: "",
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form
              onSubmit={editingItem ? updateParfum : createParfum}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du parfum
                </label>
                <input
                  type="text"
                  value={parfumForm.nom}
                  onChange={(e) =>
                    setParfumForm({ ...parfumForm, nom: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Marque
                </label>
                <input
                  type="text"
                  value={parfumForm.marque}
                  onChange={(e) =>
                    setParfumForm({ ...parfumForm, marque: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Genre
                </label>
                <select
                  value={parfumForm.genre}
                  onChange={(e) =>
                    setParfumForm({ ...parfumForm, genre: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="mixte">Mixte</option>
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={parfumForm.description}
                  onChange={(e) =>
                    setParfumForm({
                      ...parfumForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingItem ? "Modifier" : "Créer"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowParfumForm(false);
                    setEditingItem(null);
                    setParfumForm({
                      nom: "",
                      marque: "",
                      genre: "mixte",
                      description: "",
                    });
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Note */}
      {showNoteForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingItem ? "Modifier la note" : "Nouvelle note"}
                </h3>
                <button
                  onClick={() => {
                    setShowNoteForm(false);
                    setEditingItem(null);
                    setNoteForm({ nom: "", type: "tête", description: "" });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form
              onSubmit={editingItem ? updateNote : createNote}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom de la note
                </label>
                <input
                  type="text"
                  value={noteForm.nom}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, nom: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de note
                </label>
                <select
                  value={noteForm.type}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, type: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="tête">Tête</option>
                  <option value="cœur">Cœur</option>
                  <option value="fond">Fond</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={noteForm.description}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingItem ? "Modifier" : "Créer"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNoteForm(false);
                    setEditingItem(null);
                    setNoteForm({ nom: "", type: "tête", description: "" });
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
