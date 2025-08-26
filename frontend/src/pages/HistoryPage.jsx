import React, { useState, useEffect } from "react";
import { Clock, Eye, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { historyAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import ParfumCard from "../components/ParfumCard";

export default function HistoryPage() {
  const { isAuthenticated } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      } catch (error) {
        console.error("Erreur suppression:", error);
      }
    }
  };

  if (loading) {
    return (
      <div
        className="container"
        style={{ paddingTop: "80px", paddingBottom: "80px" }}
      >
        <div className="text-center">Chargement de l'historique...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <div className="flex-between">
            <div>
              <h1 className="page-title">Mon Historique</h1>
              <p className="page-subtitle">
                {history.length} parfums consultés
              </p>
            </div>
            {history.length > 0 && (
              <button onClick={clearHistory} className="btn btn-secondary">
                <Trash2 className="w-4 h-4" />
                <span className="btn-text">Vider</span>
              </button>
            )}
          </div>
        </div>

        {history.length > 0 ? (
          <div className="history-grid">
            {history.map((item, index) => (
              <div key={index} className="history-item">
                <ParfumCard parfum={item.parfum} />
                <div className="history-meta">
                  <Eye className="w-4 h-4" />
                  <span>
                    {new Date(item.viewedAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Clock className="empty-icon" />
            <h3>Aucun historique</h3>
            <p>Vos parfums consultés apparaîtront ici</p>
            <button onClick={() => navigate("/")} className="btn btn-primary">
              Découvrir des parfums
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
