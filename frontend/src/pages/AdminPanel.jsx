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

  // Vérification des droits d'accès
  useEffect(() => {
    if (!isAdmin) {
      toast.error("Accès non autorisé");
      navigate("/");
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers({ limit: 100 }),
      ]);

      setStats(statsData);
      setUsers(usersData.data.users || []);
    } catch (error) {
      console.error("Erreur chargement admin:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const exportUsers = async () => {
    try {
      const response = await adminAPI.exportUsers();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "users-scentify.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export réussi !");
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  const toggleAdminStatus = async (userId) => {
    try {
      await adminAPI.toggleAdmin(userId);
      toast.success("Statut modifié");
      loadData(); // Recharger
    } catch (error) {
      toast.error("Erreur lors de la modification");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchUsers.toLowerCase()) ||
      user.email.toLowerCase().includes(searchUsers.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour</span>
              </button>

              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Administration
                </h1>
                <p className="text-gray-600">Panel admin Scentify</p>
              </div>
            </div>

            <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
              <Crown className="w-4 h-4" />
              <span>Admin: {user?.username}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6">
            {[
              { id: "dashboard", label: "Tableau de bord", icon: BarChart3 },
              { id: "users", label: "Utilisateurs", icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium ${
                  activeTab === tab.id
                    ? "bg-gray-50 text-red-600 border-b-2 border-red-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Utilisateurs
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.users?.totalUsers || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.users?.adminUsers || 0} admins
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Parfums</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.parfums?.totalParfums || 0}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Notes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.notes?.total || 0}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Nouveaux
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.users?.recentUsers || 0}
                    </p>
                    <p className="text-xs text-gray-500">ce mois</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gestion utilisateurs */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                Gestion des utilisateurs ({filteredUsers.length})
              </h2>
              <button
                onClick={exportUsers}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Recherche */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Inscription
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {user.username}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          {user.isAdmin ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Crown className="w-3 h-3 mr-1" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <User className="w-3 h-3 mr-1" />
                              Utilisateur
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleAdminStatus(user._id)}
                            className={`p-1 rounded text-xs ${
                              user.isAdmin
                                ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                                : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                            }`}
                            title={
                              user.isAdmin
                                ? "Retirer admin"
                                : "Promouvoir admin"
                            }
                          >
                            {user.isAdmin ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
