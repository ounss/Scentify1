import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Sparkles,
  Heart,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "../styles/auth.css";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const { login, register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError(); // Effacer les erreurs précédentes

    // Validation côté client
    if (!formData.email || !formData.password) {
      console.log("❌ Email et mot de passe requis");
      return;
    }

    if (!isLogin && !formData.username) {
      console.log("❌ Nom d'utilisateur requis pour l'inscription");
      return;
    }

    try {
      if (isLogin) {
        // Connexion
        console.log("🔐 Tentative de connexion avec:", formData.email);
        const result = await login({
          email: formData.email,
          password: formData.password,
        });

        if (result.success) {
          console.log("✅ Connexion réussie, redirection...");
          navigate("/");
        } else {
          console.log("❌ Erreur de connexion:", result.error);
        }
      } else {
        // Inscription
        console.log(
          "📝 Tentative d'inscription avec:",
          formData.username,
          formData.email
        );
        const result = await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });

        if (result.success) {
          console.log("✅ Inscription réussie, redirection...");
          navigate("/");
        } else {
          console.log("❌ Erreur d'inscription:", result.error);
        }
      }
    } catch (err) {
      console.error("❌ Erreur inattendue:", err);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ username: "", email: "", password: "" });
    clearError();
  };

  const handleBackClick = () => {
    navigate(-1); // Retour à la page précédente
  };

  return (
    <div className="auth-page">
      {/* Header avec navigation retour */}
      <div className="auth-header">
        <div className="auth-header-content">
          <button className="back-button" onClick={handleBackClick}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="auth-logo">
            <div className="logo-icon">
              <div className="perfume-bottle"></div>
            </div>
            <span className="logo-text">SCENTIFY</span>
          </div>
          <div className="spacer"></div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="auth-container">
        <div className="auth-card">
          {/* Illustration décorative */}
          <div className="auth-illustration">
            <div className="floating-elements">
              <Sparkles className="sparkle sparkle-1" />
              <Heart className="sparkle sparkle-2" />
              <Sparkles className="sparkle sparkle-3" />
            </div>
            <div className="main-perfume-bottle">
              <div className="bottle-shadow"></div>
            </div>
          </div>

          {/* Contenu du formulaire */}
          <div className="auth-content">
            {/* En-tête du formulaire */}
            <div className="form-header">
              <h1 className="form-title">
                {isLogin ? "Bon retour" : "Bienvenue"}
              </h1>
              <p className="form-subtitle">
                {isLogin
                  ? "Reconnectez-vous à votre univers olfactif"
                  : "Découvrez votre signature olfactive parfaite"}
              </p>
            </div>

            {/* Affichage des erreurs */}
            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={clearError} className="error-close">
                  ×
                </button>
              </div>
            )}

            {/* ✅ CORRECTION PRINCIPALE: Utiliser <form> au lieu de <div> */}
            <form className="auth-form" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="form-group">
                  <div className="input-wrapper">
                    <User className="input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nom d'utilisateur"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required={!isLogin}
                      disabled={loading}
                      minLength={3}
                      maxLength={20}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <div className="input-wrapper">
                  <Mail className="input-icon" />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="input-wrapper">
                  <Lock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Mot de passe"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="forgot-password">
                  <a href="#" className="forgot-link">
                    Mot de passe oublié ?
                  </a>
                </div>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <span>{isLogin ? "Se connecter" : "Créer mon compte"}</span>
                )}
              </button>
            </form>

            {/* Séparateur */}
            <div className="auth-divider">
              <div className="divider-line"></div>
              <span className="divider-text">ou</span>
              <div className="divider-line"></div>
            </div>

            {/* Bouton de basculement */}
            <button
              type="button"
              className="toggle-button"
              onClick={toggleMode}
              disabled={loading}
            >
              {isLogin ? "Créer un compte" : "J'ai déjà un compte"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
