import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = isLogin
        ? await login({ email: formData.email, password: formData.password })
        : await register(formData);

      if (result.success) {
        toast.success(isLogin ? "Connexion réussie!" : "Compte créé!");
      } else {
        toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, var(--bg), var(--bg-light))",
      }}
    >
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="logo-icon mx-auto mb-4">S</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isLogin ? "Bon retour" : "Bienvenue"}
          </h1>
          <p className="text-gray-600">
            {isLogin ? "Connectez-vous à votre compte" : "Créez votre compte"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="form-group">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  className="form-input pl-10"
                  placeholder="Nom d'utilisateur"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                className="form-input pl-10"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                className="form-input pl-10 pr-10"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-500" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spin"></div>
            ) : isLogin ? (
              "Se connecter"
            ) : (
              "S'inscrire"
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center mt-6">
          <p className="text-gray-600 mb-2">
            {isLogin ? "Pas de compte ?" : "Déjà un compte ?"}
          </p>
          <button
            className="text-primary font-semibold"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
