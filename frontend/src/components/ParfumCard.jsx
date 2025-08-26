import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { favoriAPI } from "../services/api";
import toast from "react-hot-toast";

export default function ParfumCard({ parfum }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Connectez-vous pour gérer vos favoris");
      return;
    }

    try {
      if (isFavorite) {
        await favoriAPI.removeParfum(parfum._id);
        setIsFavorite(false);
        toast.success("Retiré des favoris");
      } else {
        await favoriAPI.addParfum(parfum._id);
        setIsFavorite(true);
        toast.success("Ajouté aux favoris !");
      }
    } catch (error) {
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDiscover = () => {
    navigate(`/parfum/${parfum._id}`);
  };

  return (
    <article className="card fade-in">
      <div className="card-image">
        <img
          src={
            parfum.photo ||
            "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop"
          }
          alt={parfum.nom}
        />
        <span className="card-badge">{parfum.genre}</span>
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
        <div className="flex-between mt-1">
          <button
            className="btn btn-icon btn-secondary"
            onClick={handleFavoriteToggle}
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? "fill-current text-red-500" : ""
              }`}
            />
          </button>
          <button className="btn btn-primary" onClick={handleDiscover}>
            Découvrir
          </button>
        </div>
      </div>
    </article>
  );
}
