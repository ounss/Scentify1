// frontend/src/pages/UserMenu.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Clock, Heart, LogOut, X, Settings, Crown } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import ScentifyLogo from "../components/ScentifyLogo";
import toast from "react-hot-toast";

export default function UserMenu() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  const menuItems = [
    {
      icon: User,
      label: "Profil",
      action: () => navigate("/profile"),
      description: "Gérer mes informations",
    },
    {
      icon: Clock,
      label: "Historique",
      action: () => navigate("/history"),
      description: "Mes parfums consultés",
    },
    {
      icon: Heart,
      label: "Favoris",
      action: () => navigate("/favorites"),
      description: "Mes parfums préférés",
    },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <ScentifyLogo size={64} className="text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Connectez-vous
          </h2>
          <p className="text-gray-600 mb-8">
            Accédez à votre profil et vos favoris
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="bg-red-600 text-white px-8 py-3 rounded-xl font-semibold"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">Menu</h1>
            <div className="w-10"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 pb-20">
        {/* Profil utilisateur */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              {isAdmin && (
                <div className="absolute -top-1 -right-1 bg-orange-500 text-white p-1 rounded-full">
                  <Crown className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Infos utilisateur */}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800">
                {user?.username}
              </h2>
              <p className="text-gray-600 text-sm">{user?.email}</p>
              {isAdmin && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                  <Crown className="w-3 h-3 mr-1" />
                  Administrateur
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="space-y-3 mb-8">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center space-x-4"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <item.icon className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-800">{item.label}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </button>
          ))}

          {/* Admin panel si admin */}
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="w-full bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-200 hover:shadow-md transition-all flex items-center space-x-4"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-orange-800">
                  Administration
                </h3>
                <p className="text-sm text-orange-600">Gérer l'application</p>
              </div>
            </button>
          )}
        </div>

        {/* Bouton déconnexion */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 rounded-2xl p-4 border border-red-200 hover:shadow-md transition-all flex items-center justify-center space-x-3 text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">Déconnexion</span>
        </button>

        {/* Footer info */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Version 1.0.0</p>
          <p className="mt-1">
            Membre depuis{" "}
            {new Date(user?.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>
    </div>
  );
}
