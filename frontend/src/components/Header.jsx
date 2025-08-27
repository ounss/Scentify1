// frontend/src/components/Header.jsx (Version mise à jour)
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Clock, User, Heart } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import ScentifyLogo from "./ScentifyLogo";

export default function Header() {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Top Logo Bar */}
      <div className="top-logo-bar">
        <div className="container">
          <Link to="/" className="logo-center">
            <ScentifyLogo size={32} className="text-white" />
            <span>Scentify</span>
          </Link>
        </div>
      </div>

      {/* Bottom Navigation - Mobile */}
      <nav className="bottom-nav">
        <div className="bottom-nav-container">
          <Link to="/" className={`nav-item ${isActive("/") ? "active" : ""}`}>
            <Home className="nav-icon" />
            <span className="nav-label">Accueil</span>
          </Link>

          <Link
            to={isAuthenticated ? "/history" : "/auth"}
            className={`nav-item ${isActive("/history") ? "active" : ""}`}
          >
            <Clock className="nav-icon" />
            <span className="nav-label">Historique</span>
          </Link>

          <Link
            to={isAuthenticated ? "/profile" : "/auth"}
            className={`nav-item ${
              isActive("/profile") || isActive("/auth") ? "active" : ""
            }`}
          >
            <User className="nav-icon" />
            <span className="nav-label">Compte</span>
          </Link>
        </div>
      </nav>

      {/* Desktop Navigation */}
      <header className="desktop-header">
        <div className="container">
          <div className="desktop-nav">
            <Link to="/" className="nav-link">
              Découvrir
            </Link>
            <Link to="/" className="nav-link">
              Parfums
            </Link>
            <Link to="/contact" className="nav-link">
              Contact
            </Link>
          </div>

          <div className="desktop-auth">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="btn btn-primary">
                  Profil
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="btn btn-secondary">
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/auth" className="btn btn-secondary">
                  Connexion
                </Link>
                <Link to="/auth" className="btn btn-primary">
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
