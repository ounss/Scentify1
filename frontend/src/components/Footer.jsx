import React from "react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Scentify</h3>
            <p>Votre guide personnalisé dans l'univers des parfums</p>
          </div>

          <div className="footer-section">
            <h3>Navigation</h3>
            <ul className="footer-links">
              <li>
                <a href="/">Accueil</a>
              </li>
              <li>
                <a href="#parfums">Parfums</a>
              </li>
              <li>
                <a href="#notes">Notes</a>
              </li>
              <li>
                <a href="/contact">Contact</a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Informations</h3>
            <ul className="footer-links">
              <li>
                <a href="#">À propos</a>
              </li>
              <li>
                <a href="#">FAQ</a>
              </li>
              <li>
                <a href="#">Conditions d'utilisation</a>
              </li>
              <li>
                <a href="#">Confidentialité</a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Contact</h3>
            <ul className="footer-links">
              <li>contact@scentify.app</li>
              <li>Brussels, Belgium</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024-2025 Scentify - Projet TFE par Benyaghlane Ouns</p>
        </div>
      </div>
    </footer>
  );
}
