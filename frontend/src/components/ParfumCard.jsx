import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { favoriAPI } from "../services/api";
import toast from "react-hot-toast";

export default function ParfumCard({ parfum }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(
    user?.favorisParfums?.some(
      (fav) => (typeof fav === "string" ? fav : fav._id) === parfum._id
    ) || false
  );
  const [loading, setLoading] = useState(false);

  const handleFavorite = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Connectez-vous");
      return;
    }

    setLoading(true);
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);

    try {
      if (previousState) {
        await favoriAPI.removeParfum(parfum._id);
        toast.success("Retiré des favoris");
      } else {
        await favoriAPI.addParfum(parfum._id);
        toast.success("Ajouté aux favoris");
      }
    } catch (error) {
      setIsFavorite(previousState);
      toast.error("Erreur");
    } finally {
      setLoading(false);
    }
  };

  const getGenreClass = (genre) => {
    const classes = {
      homme: "bg-blue-500",
      femme: "bg-pink-500",
      mixte: "bg-purple-500",
    };
    return classes[genre] || "bg-gray-500";
  };

  return (
    <article className="card" onClick={() => navigate(`/parfum/${parfum._id}`)}>
      <div className="card-image">
        <img
          src={
            parfum.photo ||
            "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop"
          }
          alt={parfum.nom}
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop";
          }}
        />
        <div className={`card-badge text-white ${getGenreClass(parfum.genre)}`}>
          {parfum.genre}
        </div>
      </div>

      <div className="card-content">
        <h3 className="card-title">{parfum.nom}</h3>
        <p className="card-subtitle">{parfum.marque}</p>

        <div className="card-tags">
          {parfum.notes?.slice(0, 3).map((note, index) => (
            <span
              key={note._id}
              className={index === 0 ? "tag tag-primary" : "tag"}
            >
              {note.nom}
            </span>
          ))}
        </div>

        <div className="card-actions">
          <button
            className={`btn-icon btn-ghost ${
              isFavorite ? "text-red-500" : "text-gray-500"
            }`}
            onClick={handleFavorite}
            disabled={loading}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
          </button>

          <button className="btn btn-primary">Découvrir</button>
        </div>
      </div>
    </article>
  );
}
