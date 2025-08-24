import React, { useState, useEffect } from "react";
import {
  Users,
  Package,
  BarChart3,
  Download,
  Search,
  UserCheck,
  UserX,
  Crown,
} from "lucide-react";
import { adminAPI, parfumAPI, noteAPI } from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import toast from "react-hot-toast";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUsers, setSearchUsers] = useState("");

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userStats, parfumStats, noteStats, usersList] = await Promise.all([
        adminAPI.getUserStats(),
        parfumAPI.getStats(),
        noteAPI.getStats(),
        adminAPI.getUsers({ limit: 50 }),
      ]);

      setStats({
        users: userStats.data,
        parfums: parfumStats.data,
        notes: noteStats.data,
      });
      setUsers(usersList.data.users || []);
    } catch (error) {
      console.error("Erreur chargement admin:", error);
      toast.error("Erreur lors du chargement des données");
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
      toast.success("Export CSV téléchargé !");
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  const toggleAdminStatus = async (userId) => {
    try {
      await adminAPI.toggleAdmin(userId);
      toast.success("Statut admin modifié");
      loadData(); // Recharger la liste
    } catch (error) {
      toast.error("Erreur lors de la modification");
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className={`p-4 rounded-2xl ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );

  const Dashboard = () => {
    const genreData =
      stats.parfums?.parGenre?.map((item) => ({
        name: item._id,
        value: item.count,
        color:
          item._id === "homme"
            ? "#3B82F6"
            : item._id === "femme"
            ? "#EC4899"
            : "#10B981",
      })) || [];

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h2>
          <p className="text-gray-600">
            Vue d'ensemble de votre plateforme Scentify
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Utilisateurs Total"
            value={stats.users?.totalUsers || 0}
            icon={Users}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
            subtitle={`${stats.users?.recentUsers || 0} ce mois`}
          />
          <StatCard
            title="Parfums"
            value={stats.parfums?.totalParfums || 0}
            icon={Package}
            color="bg-gradient-to-r from-purple-500 to-purple-600"
          />
          <StatCard
            title="Notes Olfactives"
            value={stats.notes?.total || 0}
            icon={BarChart3}
            color="bg-gradient-to-r from-green-500 to-green-600"
          />
          <StatCard
            title="Administrateurs"
            value={stats.users?.adminUsers || 0}
            icon={Crown}
            color="bg-gradient-to-r from-orange-500 to-orange-600"
          />
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Parfums par genre */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Parfums par Genre
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  className="outline-none"
                >
                  {genreData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {genreData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full`}
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm text-gray-600 capitalize">
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top marques */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Top Marques
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.parfums?.parMarque || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const UserManagement = () => {
    const filteredUsers = users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchUsers.toLowerCase()) ||
        user.email.toLowerCase().includes(searchUsers.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Gestion Utilisateurs
            </h2>
            <p className="text-gray-600">
              {users.length} utilisateurs inscrits
            </p>
          </div>
          <button
            onClick={exportUsers}
            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Recherche */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchUsers}
            onChange={(e) => setSearchUsers(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Table utilisateurs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Utilisateur
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Inscription
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {user.username}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user.favorisParfums?.length || 0} favoris
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {user.isAdmin ? (
                          <div className="flex items-center space-x-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                            <Crown className="w-4 h-4" />
                            <span>Admin</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                            <User className="w-4 h-4" />
                            <span>Utilisateur</span>
                          </div>
                        )}
                        {user.isVerified && (
                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            Vérifié
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleAdminStatus(user._id)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.isAdmin
                            ? "bg-orange-100 hover:bg-orange-200 text-orange-600"
                            : "bg-blue-100 hover:bg-blue-200 text-blue-600"
                        }`}
                        title={
                          user.isAdmin ? "Retirer admin" : "Promouvoir admin"
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
    );
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "users", label: "Utilisateurs", icon: Users },
  ];

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
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Administration
              </h1>
              <p className="text-gray-600">Gestion de la plateforme Scentify</p>
            </div>
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-xl font-semibold">
              Panel Admin
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-t-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-gray-50 text-red-600 border-b-2 border-red-600"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50/50"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "users" && <UserManagement />}
      </div>
    </div>
  );
}
