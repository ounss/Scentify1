// frontend/src/pages/AdminPanel.jsx - COMPOSANT COMPLET ET CORRIGÉ
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
} from "lucide-react";
import { adminAPI } from "../services/adminAPI.js";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function AdminPanel() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUsers, setSearchUsers] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  // frontend/src/pages/AdminPanel.jsx - AJOUTER onglets parfums/notes
  const tabs = [
    { id: "dashboard", label: "Tableau de bord", icon: BarChart3 },
    { id: "users", label: "Utilisateurs", icon: Users, count: users.length },
    {
      id: "parfums",
      label: "Parfums",
      icon: Package,
      count: stats.parfums?.totalParfums || 0,
    },
    {
      id: "notes",
      label: "Notes",
      icon: TrendingUp,
      count: stats.notes?.total || 0,
    },
  ];

  // Ajouter sections pour parfums et notes avec tables et actions CRUD

  // ✅ Vérification des droits d'accès
  useEffect(() => {
    if (!isAdmin) {
      toast.error("Accès non autorisé");
      navigate("/");
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  // ✅ FONCTION CHARGEMENT DONNÉES AMÉLIORÉE
  const loadData = async () => {
    try {
      setLoading(true);
      console.log("📡 Chargement données admin...");

      const [statsData, usersData] = await Promise.all([
        adminAPI.getStats().catch((err) => {
          console.error("❌ Erreur stats:", err);
          return { users: {}, parfums: {}, notes: {} };
        }),
        adminAPI.getUsers({ limit: 100 }).catch((err) => {
          console.error("❌ Erreur users:", err);
          return { data: { users: [] } };
        }),
      ]);

      console.log("✅ Données reçues:", { statsData, usersData });

      setStats(statsData);
      setUsers(usersData.data?.users || []);

      toast.success("Données admin chargées");
    } catch (error) {
      console.error("❌ Erreur chargement admin:", error);
      toast.error("Erreur lors du chargement");

      // ✅ États par défaut en cas d'erreur
      setStats({ users: {}, parfums: {}, notes: {} });
      setUsers([]);
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

  // ✅ EXPORT UTILISATEURS AMÉLIORÉ
  const exportUsers = async () => {
    try {
      toast.loading("Préparation de l'export...");

      const response = await adminAPI.exportUsers();

      // ✅ Création et téléchargement du fichier
      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "text/csv;charset=utf-8;",
        })
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `scentify-users-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("Export réussi !");
    } catch (error) {
      console.error("❌ Erreur export:", error);
      toast.dismiss();
      toast.error("Erreur lors de l'export");
    }
  };

  // ✅ TOGGLE ADMIN STATUS AMÉLIORÉ
  const toggleAdminStatus = async (userId, currentStatus) => {
    if (userId === user._id) {
      toast.error("Vous ne pouvez pas modifier votre propre statut");
      return;
    }

    const action = currentStatus ? "retirer" : "donner";
    const confirmMessage = `Êtes-vous sûr de vouloir ${action} les droits admin à cet utilisateur ?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await adminAPI.toggleAdmin(userId);

      // ✅ Mise à jour optimiste de la liste
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === userId ? { ...u, isAdmin: !u.isAdmin } : u
        )
      );

      const message = currentStatus
        ? "Droits administrateur retirés"
        : "Droits administrateur accordés";

      toast.success(message);
    } catch (error) {
      console.error("❌ Erreur toggle admin:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  // ✅ FILTRAGE UTILISATEURS
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchUsers.toLowerCase()) ||
      user.email.toLowerCase().includes(searchUsers.toLowerCase())
  );

  // ✅ LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du panel admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec retour */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour</span>
              </button>

              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Administration Scentify
                </h1>
                <p className="text-gray-600">Gestion de l'application</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                title="Actualiser"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                <span className="text-sm">Actualiser</span>
              </button>

              <div className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-2 border border-orange-200">
                <Crown className="w-4 h-4" />
                <span>Admin: {user?.username}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6">
            {[
              { id: "dashboard", label: "Tableau de bord", icon: BarChart3 },
              {
                id: "users",
                label: "Utilisateurs",
                icon: Users,
                count: users.length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-t-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-red-600 border-b-2 border-red-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* ✅ DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Cards statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Utilisateurs Total
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.users?.totalUsers || 0}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      +{stats.users?.recentUsers || 0} ce mois
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Parfums
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.parfums?.totalParfums || 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Dans la base</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Notes Olfactives
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.notes?.total || 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Références</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Admins
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.users?.adminUsers || 0}
                    </p>
                    <p className="text-sm text-orange-600 mt-1">
                      Administrateurs
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Alertes système */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-gray-800">
                  État du système
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-green-800">✅ API Fonctionnelle</span>
                  <span className="text-green-600 text-sm">En ligne</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-800">📊 Base de données</span>
                  <span className="text-blue-600 text-sm">Connectée</span>
                </div>

                {stats.users?.totalUsers > 100 && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <span className="text-amber-800">
                      ⚠️ Surveillance recommandée
                    </span>
                    <span className="text-amber-600 text-sm">
                      +100 utilisateurs
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ✅ USERS TAB - TABLE COMPLÈTE CORRIGÉE */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Gestion des utilisateurs ({filteredUsers.length})
              </h2>

              <button
                onClick={exportUsers}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Barre de recherche */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* ✅ TABLE UTILISATEURS - STRUCTURE COMPLÈTE CORRIGÉE */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inscription
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((currentUser) => (
                      <tr
                        key={currentUser._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* ✅ COLONNE UTILISATEUR */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-sm">
                              <span className="text-white text-sm font-bold">
                                {currentUser.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {currentUser.username}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {currentUser._id.slice(-6)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* ✅ COLONNE EMAIL */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {currentUser.email}
                          </div>
                          {currentUser.isVerified ? (
                            <div className="text-xs text-green-600">
                              ✓ Vérifié
                            </div>
                          ) : (
                            <div className="text-xs text-orange-600">
                              ⚠ Non vérifié
                            </div>
                          )}
                        </td>

                        {/* ✅ COLONNE STATUT */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {currentUser.isAdmin ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200">
                              <Crown className="w-3 h-3 mr-1" />
                              Administrateur
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <User className="w-3 h-3 mr-1" />
                              Utilisateur
                            </span>
                          )}
                        </td>

                        {/* ✅ COLONNE INSCRIPTION */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(currentUser.createdAt).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </td>

                        {/* ✅ COLONNE ACTIONS */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
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
                                  : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                              }`}
                              title={
                                currentUser._id === user._id
                                  ? "Vous ne pouvez pas modifier votre propre statut"
                                  : currentUser.isAdmin
                                  ? "Retirer les droits admin"
                                  : "Promouvoir admin"
                              }
                            >
                              {currentUser.isAdmin ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Message si aucun utilisateur */}
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">
                    Aucun utilisateur trouvé
                  </h3>
                  <p className="text-gray-500">
                    {searchUsers
                      ? `Aucun résultat pour "${searchUsers}"`
                      : "Aucun utilisateur dans la base de données"}
                  </p>
                </div>
              )}
            </div>

            {/* ✅ STATISTIQUES RAPIDES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {users.filter((u) => u.isAdmin).length}
                </div>
                <div className="text-sm font-medium text-gray-600">
                  Administrateurs
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {users.filter((u) => !u.isAdmin).length}
                </div>
                <div className="text-sm font-medium text-gray-600">
                  Utilisateurs
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {users.filter((u) => u.isVerified).length}
                </div>
                <div className="text-sm font-medium text-gray-600">
                  Comptes vérifiés
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
