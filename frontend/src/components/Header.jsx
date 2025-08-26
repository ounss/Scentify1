import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  User,
  Heart,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Déconnexion réussie");
    navigate("/");
    setShowUserMenu(false);
  };

  const navLinks = [
    { path: "/", label: "Accueil", active: location.pathname === "/" },
    {
      path: "/contact",
      label: "Contact",
      active: location.pathname === "/contact",
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Scentify
            </span>
          </Link>

          {/* Barre de recherche desktop */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-lg mx-8"
          >
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
              <input
                type="text"
                placeholder="Rechercher un parfum..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
          </form>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium transition-colors ${
                  link.active
                    ? "text-red-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {isAdmin && <Crown className="w-4 h-4 text-orange-500" />}
                </button>

                {/* Menu utilisateur */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-800">
                        {user?.username}
                      </p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                      {isAdmin && (
                        <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full mt-2 font-medium">
                          Administrateur
                        </span>
                      )}
                    </div>

                    <div className="py-2">
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700">Mon profil</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="w-5 h-5 text-gray-500" />
                          <span className="text-gray-700">Administration</span>
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700">Déconnexion</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
              >
                Connexion
              </Link>
            )}
          </div>

          {/* Menu mobile */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            {showMobileMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Menu mobile */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {/* Recherche mobile */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </form>

            {/* Navigation mobile */}
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-xl font-medium transition-colors ${
                    link.active
                      ? "bg-red-50 text-red-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {isAuthenticated ? (
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/profile"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <User className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">Mon profil</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <Settings className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">Administration</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors w-full text-left"
                  >
                    <LogOut className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">Déconnexion</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/auth"
                    onClick={() => setShowMobileMenu(false)}
                    className="block bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold text-center"
                  >
                    Connexion
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
