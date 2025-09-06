// frontend/src/pages/VerifyEmail.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Mail, ArrowLeft } from "lucide-react";
import { authAPI } from "../services/api";
// On n'a pas besoin d'appeler login(email, password) ici.
// Le backend renvoie un JWT : on l'enregistre puis on rafraîchit l'app proprement.

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      const token = searchParams.get("token");

      if (!token) {
        if (!isMounted) return;
        setStatus("error");
        setMessage("Token de vérification manquant.");
        return;
      }

      try {
        // On appelle l'API qui active le compte
        const res = await authAPI.verifyEmail(token);
        // Attendus côté backend: { message, token, user }
        const apiMessage = res?.data?.message || "Email vérifié avec succès !";
        const jwt = res?.data?.token;
        const user = res?.data?.user;

        // Si un JWT est renvoyé, on le stocke pour connecter l'utilisateur
        if (jwt) {
          localStorage.setItem("token", jwt);
        }
        if (user) {
          try {
            localStorage.setItem("user", JSON.stringify(user));
          } catch {
            // ignore JSON errors
          }
        }

        if (!isMounted) return;
        setStatus("success");
        setMessage(apiMessage);

        // Redirection douce (on rafraîchit l'app pour que le contexte Auth se mette à jour)
        setTimeout(() => {
          // window.location.replace("/") garantit un refresh complet de la SPA
          window.location.replace("/");
        }, 2000);
      } catch (error) {
        const apiErr =
          error?.response?.data?.message ||
          error?.message ||
          "Erreur de vérification.";
        if (!isMounted) return;
        setStatus("error");
        setMessage(apiErr);
      }
    };

    verifyToken();
    return () => {
      isMounted = false;
    };
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Header */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Vérification Email
          </h1>
        </div>

        {/* Contenus */}
        {status === "loading" && (
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600">Vérification en cours...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h2 className="text-xl font-semibold text-green-600 mb-2">
                Succès !
              </h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500 mt-2">
                Redirection automatique dans quelques secondes...
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <div>
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                Erreur
              </h2>
              <p className="text-gray-600">{message}</p>
            </div>

            <div className="space-y-3 pt-4">
              <button
                onClick={() => navigate("/auth")} // tu peux aussi déclencher ici un appel: authAPI.resendVerification(email)
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                <Mail className="w-4 h-4 inline mr-2" />
                Demander un nouveau lien
              </button>

              <button
                onClick={() => navigate("/")}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Retour à l'accueil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
