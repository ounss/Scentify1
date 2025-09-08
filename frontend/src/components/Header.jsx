import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  Shield,
  Mail,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import "../styles/Header.css"; // Import du CSS spécifique au header

export default function Header() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
    { to: "/contact", label: "Contact", icon: Mail },
    ...(isAuthenticated
      ? [
          { to: "/history", label: "Historique", icon: Clock },
          { to: "/history?tab=favorites", label: "Favoris", icon: Heart }, // ✅ MODIFICATION
          { to: "/profile", label: "Profil", icon: User },
        ]
      : []),
  ];

  // Vérifier si l'onglet est actif
  const isActiveTab = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Header Desktop/Mobile */}
      <header className="header-responsive">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="perfume-icon">
              <div className="brand-name">SCENTIFY</div>
            </Link>

            {/* Navigation Desktop - Onglets */}
            <nav className="hidden md:flex items-center">
              <div className="desktop-tabs">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`desktop-tab ${
                      isActiveTab(item.to) ? "active" : ""
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </nav>

            {/* Actions Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {/* Badge Admin */}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="admin-badge flex items-center space-x-2"
                    >
                      <Crown className="w-4 h-4" />
                      <span className="font-semibold">Admin</span>
                    </Link>
                  )}

                  {/* Profil utilisateur */}
                  <div className="flex items-center space-x-3">
                    <Link to="/profile" className="user-avatar">
                      {user?.firstName?.charAt(0)?.toUpperCase() ||
                        user?.email?.charAt(0)?.toUpperCase() ||
                        "U"}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="logout-btn flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="auth-buttons">
                  <Link to="/auth" className="btn-secondary">
                    Se connecter
                  </Link>
                  <Link to="/auth" className="btn-primary">
                    Créer un compte
                  </Link>
                </div>
              )}
            </div>

            {/* Burger Menu Mobile */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="mobile-menu-overlay md:hidden">
          <div
            className="mobile-menu-backdrop"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className={`mobile-menu-panel ${showMobileMenu ? "open" : ""}`}>
            {/* Header du menu mobile */}
            <div className="mobile-menu-header">
              <div className="flex items-center space-x-3">
                <div className="logo-icon">S</div>
                <span className="text-lg font-bold">Scentify</span>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu du menu mobile */}
            <div className="mobile-menu-content">
              {isAuthenticated ? (
                <>
                  {/* Carte utilisateur */}
                  <div className="mobile-user-card">
                    <div className="flex items-center space-x-3">
                      <div className="mobile-user-avatar">
                        {user?.firstName?.charAt(0)?.toUpperCase() ||
                          user?.email?.charAt(0)?.toUpperCase() ||
                          "U"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {user?.firstName || "Utilisateur"}
                        </p>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <nav className="space-y-2">
                    {navItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setShowMobileMenu(false)}
                        className="mobile-nav-item"
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}

                    {/* Lien Admin si admin */}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setShowMobileMenu(false)}
                        className="mobile-nav-item admin"
                      >
                        <Shield className="w-5 h-5" />
                        <span className="font-medium">Administration</span>
                      </Link>
                    )}
                  </nav>

                  {/* Bouton déconnexion */}
                  <button onClick={handleLogout} className="mobile-logout-btn">
                    <LogOut className="w-5 h-5" />
                    <span>Se déconnecter</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Navigation publique */}
                  <nav className="space-y-2">
                    <Link
                      to="/"
                      onClick={() => setShowMobileMenu(false)}
                      className="mobile-nav-item"
                    >
                      <Home className="w-5 h-5" />
                      <span className="font-medium">Accueil</span>
                    </Link>
                    <Link
                      to="/contact"
                      onClick={() => setShowMobileMenu(false)}
                      className="mobile-nav-item"
                    >
                      <Mail className="w-5 h-5" />
                      <span className="font-medium">Contact</span>
                    </Link>
                  </nav>
                  {/* Boutons d'authentification */}
                  <div className="mobile-auth-buttons">
                    <Link
                      to="/auth"
                      onClick={() => setShowMobileMenu(false)}
                      className="mobile-auth-primary"
                    >
                      <User className="w-5 h-5" />
                      <span>Créer un compte</span>
                    </Link>
                    <Link
                      to="/auth"
                      onClick={() => setShowMobileMenu(false)}
                      className="mobile-auth-secondary"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Se connecter</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Mobile */}
      <nav className="bottom-nav md:hidden">
        <div className="nav-container">
          <Link
            to="/"
            className={`nav-item ${location.pathname === "/" ? "active" : ""}`}
          >
            <Home className="nav-icon" />
            <span className="nav-label">Accueil</span>
          </Link>
          <Link
            to={isAuthenticated ? "/history?tab=favorites" : "/auth"} // ✅ MODIFICATION
            className={`nav-item ${
              location.pathname.startsWith("/history") &&
              location.search.includes("favorites")
                ? "active"
                : ""
            }`}
          >
            <Heart className="nav-icon" />
            <span className="nav-label">Favoris</span>
          </Link>
          <Link
            to={isAuthenticated ? "/profile" : "/auth"}
            className={`nav-item ${
              location.pathname.startsWith("/profile") ? "active" : ""
            }`}
          >
            <User className="nav-icon" />
            <span className="nav-label">Profil</span>
          </Link>
        </div>
        <Link
          to="/contact"
          className={`nav-item ${
            location.pathname === "/contact" ? "active" : ""
          }`}
        >
          <Mail className="nav-icon" />
          <span className="nav-label">Contact</span>
        </Link>
      </nav>
    </>
  );
}
