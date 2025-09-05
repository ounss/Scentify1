import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      {/* Bandeau fin (accent) */}
      <div className="footer-accent" aria-hidden="true" />

      <div className="container">
        <div className="footer-content">
          <section className="footer-section footer-brand">
            <div className="footer-logo">S</div>
            <div>
              <h3 className="footer-title">Scentify</h3>
              <p className="footer-subtitle">
                Votre guide personnalisé dans l'univers des parfums.
              </p>
            </div>
          </section>

          <nav className="footer-section" aria-label="Navigation principale">
            <h3 className="footer-heading">Navigation</h3>
            <ul className="footer-links">
              <li>
                <Link className="footer-link" to="/">
                  Accueil
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/profile">
                  Compte
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/contact">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          <nav className="footer-section" aria-label="Informations légales">
            <h3 className="footer-heading">Informations</h3>
            <ul className="footer-links">
              <li>
                <Link className="footer-link" to="/about">
                  À propos
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/faq">
                  FAQ
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/terms">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link className="footer-link" to="/privacy">
                  Confidentialité
                </Link>
              </li>
            </ul>
          </nav>

          <section className="footer-section">
            <h3 className="footer-heading">Contact</h3>
            <ul className="footer-links">
              <li>
                <a className="footer-link" href="mailto:contact@scentify.app">
                  contact@scentify.app
                </a>
              </li>
              <li className="footer-dim">Brussels, Belgium</li>
            </ul>
          </section>
        </div>

        <div className="footer-bottom">
          <p className="footer-small">
            &copy; 2024–{year} Scentify — Projet TFE par Ben Yaghlane Ouns
          </p>
        </div>
      </div>
    </footer>
  );
}
