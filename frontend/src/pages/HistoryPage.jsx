// frontend/src/pages/HistoryPage.jsx (Version mise à jour)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Search, Trash2, Eye } from "lucide-react";
import { historyAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import ScentifyLogo from "../components/ScentifyLogo";
import toast from "react-hot-toast";

export default function HistoryPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    loadHistory();
  }, [isAuthenticated, navigate]);

  const loadHistory = async () => {
    try {
      const response = await historyAPI.getHistory({ limit: 50 });
      setHistory(response.data);
    } catch (error) {
      console.error("Erreur chargement historique:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (window.confirm("Vider votre historique ?")) {
      try {
        await historyAPI.clearHistory();
        setHistory([]);
        toast.success("Historique vidé");
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <ScentifyLogo size={24} className="text-red-500" />
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans l'historique..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 pb-20">
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-4 shadow-sm border cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate(`/parfum/${item.parfum._id}`)}
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={
                      item.parfum.photo ||
                      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=80&h=80&fit=crop"
                    }
                    alt={item.parfum.nom}
                    className="w-16 h-16 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">
                      {item.parfum.nom}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {item.parfum.marque}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Consulté le{" "}
                      {new Date(item.viewedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Eye className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Clock className="w-20 h-20 text-gray-200 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-600 mb-4">
              Aucun historique
            </h3>
            <p className="text-gray-500 mb-8 px-4">
              Vos parfums consultés apparaîtront ici
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-red-600 text-white px-8 py-3 rounded-xl font-semibold"
            >
              Découvrir des parfums
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
