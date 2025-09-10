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
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../styles/auth.css";

const AuthPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isRegisterMode = searchParams.get("mode") === "register";
  const [isLogin, setIsLogin] = useState(!isRegisterMode);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [emailForReset, setEmailForReset] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    login,
    register,
    loading,
    error,
    clearError,
    needsVerification, // ✅ AJOUT
    forgotPassword, // ✅ AJOUT
    resendVerificationEmail, // ✅ AJOUT
  } = useAuth();
  const navigate = useNavigate();

  // ✅ Fonction pour mot de passe oublié
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearError();

    if (!emailForReset) {
      console.log("❌ Email requis pour réinitialisation");
      return;
    }

    try {
      console.log("📧 Demande de réinitialisation pour:", emailForReset);
      const result = await forgotPassword(emailForReset);

      if (result.success) {
        setSuccessMessage(result.message);
        setForgotPasswordMode(false);
        setEmailForReset("");
      } else {
        console.log("❌ Erreur mot de passe oublié:", result.error);
      }
    } catch (err) {
      console.error("❌ Erreur inattendue:", err);
    }
  };

  // ✅ Fonction pour renvoyer l'email de vérification
  const handleResendVerification = async () => {
    if (!formData.email) {
      console.log("❌ Email requis pour renvoyer la vérification");
      return;
    }

    try {
      const result = await resendVerificationEmail(formData.email);
      if (result.success) {
        setSuccessMessage(result.message);
      }
    } catch (err) {
      console.error("❌ Erreur renvoi vérification:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setSuccessMessage(""); // Clear success message

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
        console.log("🔐 Tentative de connexion avec:", formData.email);
        const result = await login({
          email: formData.email,
          password: formData.password,
        });

        if (result.success) {
          console.log("✅ Connexion réussie, redirection...");
          navigate("/");
        } else if (result.needsVerification) {
          // ✅ NOUVEAU: Gestion cas email non vérifié
          console.log("⚠️ Email non vérifié");
          setSuccessMessage(""); // Ne pas afficher comme succès
          // L'erreur sera affichée par le contexte
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
          if (result.needsVerification) {
            // ✅ NOUVEAU: Gestion inscription avec vérification email
            setSuccessMessage(
              result.message ||
                "Compte créé ! Vérifiez votre email pour l'activer."
            );
            setIsLogin(true); // Basculer vers connexion
            setFormData({ username: "", email: formData.email, password: "" });
          } else {
            console.log("✅ Inscription réussie, redirection...");
            navigate("/");
          }
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
    setSuccessMessage(""); // ✅ AJOUT
    setForgotPasswordMode(false); // ✅ AJOUT
  };

  const handleBackClick = () => {
    navigate(-1); // Retour à la page précédente
  };

  // ✅ Si en mode "mot de passe oublié", afficher le formulaire spécial
  if (forgotPasswordMode) {
    return (
      <div className="auth-page">
        <div className="auth-header">
          <div className="auth-header-content">
            <button className="back-button" onClick={handleBackClick}>
              <ArrowLeft className="w-5 h-5" /> Retour
            </button>
          </div>
        </div>

        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-content">
              <div className="form-header">
                <h1 className="form-title">Mot de passe oublié</h1>
                <p className="form-subtitle">
                  Entrez votre email pour recevoir un lien de réinitialisation
                </p>
              </div>

              {error && (
                <div className="error-message">
                  <p>{error}</p>
                  <button onClick={clearError} className="error-close">
                    ×
                  </button>
                </div>
              )}

              {successMessage && (
                <div className="success-message">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="auth-form">
                <div className="form-group">
                  <div className="input-wrapper">
                    <Mail className="input-icon" />
                    <input
                      type="email"
                      className="form-input"
                      placeholder="Votre email"
                      value={emailForReset}
                      onChange={(e) => setEmailForReset(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    "Envoyer le lien"
                  )}
                </button>
              </form>

              <button
                type="button"
                className="toggle-button"
                onClick={() => {
                  setForgotPasswordMode(false);
                  setEmailForReset("");
                  clearError();
                }}
                disabled={loading}
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

            {/* Message de succès */}
            {successMessage && (
              <div className="success-message">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Affichage des erreurs */}
            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={clearError} className="error-close">
                  ×
                </button>
              </div>
            )}

            {/* Bouton vérification email si besoin */}
            {needsVerification && (
              <div className="verification-notice">
                <div className="verification-content">
                  <Mail className="w-6 h-6 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      Email non vérifié
                    </p>
                    <p className="text-xs text-orange-600">
                      Vérifiez votre boîte mail et cliquez sur le lien de
                      vérification
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleResendVerification}
                  className="resend-button"
                  disabled={loading}
                >
                  Renvoyer l'email
                </button>
              </div>
            )}

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
                  <button
                    type="button"
                    onClick={() => setForgotPasswordMode(true)}
                    className="forgot-link"
                  >
                    Mot de passe oublié ?
                  </button>
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
