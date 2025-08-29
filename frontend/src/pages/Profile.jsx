// frontend/src/pages/Profile.jsx - CORRECTION COMPLÈTE
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Heart,
  Clock,
  Settings,
  Trash2,
  Eye,
  Crown,
  Mail,
  Calendar,
  LogOut,
  ArrowLeft,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { favoriAPI, historyAPI, authAPI } from "../services/api";
import ParfumCard from "../components/ParfumCard";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, updateUser, logout, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [favorites, setFavorites] = useState({ parfums: [], notes: [] });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });

  // ✅ VÉRIFICATION AUTHENTIFICATION
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Veuillez vous connecter");
      navigate("/auth");
      return;
    }

    if (!user) {
      toast.error("Erreur de chargement du profil");
      navigate("/");
      return;
    }

    loadUserData();
  }, [isAuthenticated, user, navigate]);

  // ✅ CHARGEMENT DES DONNÉES UTILISATEUR
  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const [favoritesRes, historyRes] = await Promise.all([
        favoriAPI.getFavorites().catch((err) => {
          console.warn("Erreur favoris:", err);
          return { data: { parfums: [], notes: [] } };
        }),
        historyAPI.getHistory({ limit: 20 }).catch((err) => {
          console.warn("Erreur historique:", err);
          return { data: [] };
        }),
      ]);

      setFavorites(favoritesRes.data);
      setHistory(historyRes.data);

      console.log("✅ Données profil chargées:", {
        favorisParfums: favoritesRes.data.parfums?.length || 0,
        historique: historyRes.data?.length || 0,
      });
    } catch (error) {
      console.error("❌ Erreur chargement profil:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  // ✅ MISE À JOUR DU PROFIL
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!editForm.username.trim() || !editForm.email.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      const response = await authAPI.updateProfile(editForm);
      updateUser(response.data);
      setIsEditing(false);
      toast.success("Profil mis à jour !");

      // Mettre à jour le formulaire avec les nouvelles données
      setEditForm({
        username: response.data.username,
        email: response.data.email,
      });
    } catch (error) {
      console.error("❌ Erreur mise à jour profil:", error);
      toast.error(error.response?.data?.message || "Erreur de mise à jour");
    }
  };

  // ✅ SUPPRIMER UN FAVORI
  const removeFavorite = async (parfumId) => {
    if (!window.confirm("Retirer ce parfum des favoris ?")) return;

    try {
      await favoriAPI.removeParfum(parfumId);
      setFavorites((prev) => ({
        ...prev,
        parfums: prev.parfums.filter((p) => p._id !== parfumId),
      }));
      toast.success("Retiré des favoris");

      // Déclencher mise à jour du contexte
      window.dispatchEvent(new CustomEvent("favorisUpdated"));
    } catch (error) {
      console.error("❌ Erreur suppression favori:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // ✅ VIDER L'HISTORIQUE
  const clearHistory = async () => {
    if (!window.confirm("Voulez-vous vraiment vider votre historique ?"))
      return;

    try {
      await historyAPI.clearHistory();
      setHistory([]);
      toast.success("Historique vidé");
    } catch (error) {
      console.error("❌ Erreur clear history:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // ✅ DÉCONNEXION
  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      logout();
      toast.success("Déconnexion réussie");
      navigate("/");
    }
  };

  // ✅ NAVIGATION VERS ADMIN
  const goToAdmin = () => navigate("/admin");

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

  // ✅ ÉTAT DE CHARGEMENT
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  // ✅ VÉRIFICATION UTILISATEUR
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-600 mb-4">
            Profil non disponible
          </h2>
          <button
            onClick={() => navigate("/")}
            className="bg-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-700"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header mobile */}
      <div className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">Profil</h1>
          <div className="w-9"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header du profil */}
        <div className="bg-white rounded-3xl shadow-lg p-6 lg:p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-r from-red-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl lg:text-4xl">
                  {user.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              {isAdmin && (
                <div className="absolute -top-2 -right-2 bg-orange-500 text-white p-2 rounded-full shadow-lg">
                  <Crown className="w-4 h-4 lg:w-5 lg:h-5" />
                </div>
              )}
            </div>

            {/* Informations */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                {user.username}
              </h1>

              <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-2 lg:space-y-0 lg:space-x-6 text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Membre depuis{" "}
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6">
                {isAdmin && (
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Crown className="w-3 h-3" />
                    <span>Administrateur</span>
                  </span>
                )}
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {favorites.parfums.length} favoris
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {history.length} vus récemment
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                <button
                  onClick={() => {
                    setEditForm({ username: user.username, email: user.email });
                    setIsEditing(true);
                  }}
                  className="bg-red-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Modifier</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={goToAdmin}
                    className="bg-orange-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center space-x-2"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Dashboard Admin</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="bg-gray-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="bg-white rounded-3xl shadow-lg mb-8 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 lg:px-6 py-4 font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-red-50 text-red-600 border-b-2 border-red-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        activeTab === tab.id
                          ? "bg-red-200 text-red-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Contenu des onglets */}
          <div className="p-6 lg:p-8">
            {/* Onglet Aperçu */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Aperçu de votre compte
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6">
                      <div className="flex items-center space-x-4">
                        <Heart className="w-10 h-10 text-blue-600" />
                        <div>
                          <div className="text-2xl font-bold text-blue-800">
                            {favorites.parfums.length}
                          </div>
                          <div className="text-blue-600 font-medium">
                            Parfums favoris
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6">
                      <div className="flex items-center space-x-4">
                        <Clock className="w-10 h-10 text-green-600" />
                        <div>
                          <div className="text-2xl font-bold text-green-800">
                            {history.length}
                          </div>
                          <div className="text-green-600 font-medium">
                            Parfums consultés
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6">
                      <div className="flex items-center space-x-4">
                        <User className="w-10 h-10 text-purple-600" />
                        <div>
                          <div className="text-2xl font-bold text-purple-800">
                            {Math.floor(
                              (Date.now() - new Date(user.createdAt)) /
                                (1000 * 60 * 60 * 24)
                            )}
                          </div>
                          <div className="text-purple-600 font-medium">
                            Jours membre
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Derniers favoris */}
                {favorites.parfums.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-800">
                        Derniers favoris
                      </h3>
                      <button
                        onClick={() => setActiveTab("favorites")}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Voir tout
                      </button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Mes parfums favoris
                  </h2>
                  <span className="text-gray-500">
                    {favorites.parfums.length} parfum
                    {favorites.parfums.length > 1 ? "s" : ""}
                  </span>
                </div>

                {favorites.parfums.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favorites.parfums.map((parfum) => (
                      <div key={parfum._id} className="relative group">
                        <ParfumCard parfum={parfum} />
                        <button
                          onClick={() => removeFavorite(parfum._id)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                          title="Retirer des favoris"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Heart className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-600 mb-4">
                      Aucun favori pour le moment
                    </h3>
                    <p className="text-gray-500 mb-8">
                      Explorez notre collection et ajoutez vos parfums préférés
                    </p>
                    <button
                      onClick={() => navigate("/")}
                      className="bg-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
                    >
                      Découvrir des parfums
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Onglet Historique */}
            {activeTab === "history" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Historique de navigation
                  </h2>
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-500">
                      {history.length} parfum{history.length > 1 ? "s" : ""} vu
                      {history.length > 1 ? "s" : ""}
                    </span>
                    {history.length > 0 && (
                      <button
                        onClick={clearHistory}
                        className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Vider</span>
                      </button>
                    )}
                  </div>
                </div>

                {history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => navigate(`/parfum/${item.parfum._id}`)}
                      >
                        <img
                          src={
                            item.parfum.photo ||
                            "https://images.unsplash.com/photo-1541643600914-78b084683601?w=80&h=80&fit=crop"
                          }
                          alt={item.parfum.nom}
                          className="w-16 h-16 object-cover rounded-xl"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">
                            {item.parfum.nom}
                          </h3>
                          <p className="text-gray-600">{item.parfum.marque}</p>
                          <p className="text-sm text-gray-500">
                            Consulté le{" "}
                            {new Date(item.viewedAt).toLocaleDateString(
                              "fr-FR"
                            )}
                          </p>
                        </div>
                        <Eye className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Clock className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-600 mb-4">
                      Aucun historique
                    </h3>
                    <p className="text-gray-500">
                      Vos parfums récemment consultés apparaîtront ici
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Onglet Paramètres */}
            {activeTab === "settings" && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Paramètres du compte
                </h2>

                {isEditing ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nom d'utilisateur
                      </label>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) =>
                          setEditForm({ ...editForm, username: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                        minLength={3}
                        maxLength={20}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>

                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Enregistrer</span>
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
                        className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors flex items-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Annuler</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-800 mb-4">
                        Informations personnelles
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">
                            Nom d'utilisateur:
                          </span>
                          <span className="font-semibold">{user.username}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-semibold">{user.email}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Membre depuis:</span>
                          <span className="font-semibold">
                            {new Date(user.createdAt).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                        </div>
                        {isAdmin && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Statut:</span>
                            <span className="font-semibold text-orange-600 flex items-center space-x-1">
                              <Crown className="w-4 h-4" />
                              <span>Administrateur</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setEditForm({
                            username: user.username,
                            email: user.email,
                          });
                          setIsEditing(true);
                        }}
                        className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center space-x-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Modifier mes informations</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="text-red-600 hover:text-red-700 font-semibold flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
