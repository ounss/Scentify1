import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  Clock,
  User,
  Heart,
  Crown,
  LogOut,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function Header() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      logout();
      toast.success("Déconnexion réussie");
      navigate("/");
      setShowMobileMenu(false);
    }
  };

  // Navigation items pour desktop
  const navItems = [
    { to: "/", label: "Accueil", icon: Home },
    ...(isAuthenticated
      ? [
          { to: "/history", label: "Historique", icon: Clock },
          { to: "/favorites", label: "Favoris", icon: Heart },
          { to: "/profile", label: "Profil", icon: User },
        ]
      : []),
  ];

  return (
    <>
      {/* Header Desktop/Mobile */}
      <header className="header-responsive">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="logo flex items-center space-x-3">
              <div className="logo-icon">S</div>
              <span className="text-xl font-bold text-gray-800">Scentify</span>
            </Link>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="nav-link flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Actions Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {/* Badge Admin */}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="admin-badge flex items-center space-x-2 bg-orange-500 text-white px-3 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition-colors"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Admin</span>
                    </Link>
                  )}

                  {/* Avatar utilisateur */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {user?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-gray-700 font-medium">
                      {user?.username}
                    </span>
                  </div>

                  {/* Bouton déconnexion */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                    title="Se déconnecter"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/auth"
                    className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/auth"
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Inscription
                  </Link>
                </div>
              )}
            </div>

            {/* Menu burger Mobile */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-800"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Menu Mobile Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />

          <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header du menu mobile */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="logo-icon">S</div>
                  <span className="text-lg font-bold text-gray-800">Menu</span>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Contenu du menu */}
              <div className="flex-1 overflow-y-auto p-6">
                {isAuthenticated ? (
                  <>
                    {/* Profil utilisateur */}
                    <div className="mb-8 p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {user?.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {user?.username}
                          </h3>
                          <p className="text-sm text-gray-600">{user?.email}</p>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center space-x-2 text-orange-600 text-sm font-medium">
                          <Crown className="w-4 h-4" />
                          <span>Administrateur</span>
                        </div>
                      )}
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2 mb-8">
                      {navItems.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setShowMobileMenu(false)}
                          className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      ))}

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowMobileMenu(false)}
                          className="flex items-center space-x-3 p-3 text-orange-600 bg-orange-50 rounded-xl transition-colors"
                        >
                          <Settings className="w-5 h-5" />
                          <span className="font-medium">Administration</span>
                        </Link>
                      )}
                    </nav>

                    {/* Déconnexion */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center space-x-2 p-3 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Déconnexion</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Message non connecté */}
                    <div className="text-center mb-8 p-6 bg-gray-50 rounded-xl">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-800 mb-2">
                        Rejoignez Scentify
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Découvrez vos parfums préférés
                      </p>
                    </div>

                    {/* Boutons auth */}
                    <div className="space-y-3">
                      <Link
                        to="/auth"
                        onClick={() => setShowMobileMenu(false)}
                        className="w-full bg-red-600 text-white text-center py-3 px-4 rounded-xl font-semibold hover:bg-red-700 transition-colors block"
                      >
                        Se connecter
                      </Link>
                      <Link
                        to="/auth"
                        onClick={() => setShowMobileMenu(false)}
                        className="w-full bg-gray-200 text-gray-800 text-center py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 transition-colors block"
                      >
                        Créer un compte
                      </Link>
                    </div>

                    {/* Navigation publique */}
                    <nav className="mt-8 space-y-2">
                      <Link
                        to="/"
                        onClick={() => setShowMobileMenu(false)}
                        className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <Home className="w-5 h-5" />
                        <span className="font-medium">Accueil</span>
                      </Link>
                    </nav>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Mobile */}
      <nav className="bottom-nav md:hidden">
        <div className="nav-container">
          <Link to="/" className="nav-item">
            <Home className="nav-icon" />
            <span className="nav-label">Accueil</span>
          </Link>

          <Link
            to={isAuthenticated ? "/history" : "/auth"}
            className="nav-item"
          >
            <Clock className="nav-icon" />
            <span className="nav-label">Historique</span>
          </Link>

          <Link
            to={isAuthenticated ? "/profile" : "/auth"}
            className="nav-item"
          >
            <User className="nav-icon" />
            <span className="nav-label">Profil</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
