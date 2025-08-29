import React from "react";
import { Link } from "react-router-dom";
import { Home, Clock, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* Top Header */}
      <header className="header">
        <Link to="/" className="logo">
          <div className="logo-icon">S</div>
          <span className="text-xl font-bold">Scentify</span>
        </Link>
      </header>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
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
