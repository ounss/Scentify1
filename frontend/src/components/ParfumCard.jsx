// frontend/src/components/ParfumCard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { favoriAPI } from "../services/api";
import toast from "react-hot-toast";

export default function ParfumCard({ parfum }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  // Image calculée + fallback
  const imgSrc = useMemo(
    () =>
      parfum?.photo ||
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop",
    [parfum?.photo]
  );

  // ✅ Vérifier si parfum est dans les favoris (IDs OU objets)
  useEffect(() => {
    if (isAuthenticated && user?.favorisParfums && parfum?._id) {
      const isInFavorites = user.favorisParfums.some((favParfum) => {
        const favId =
          typeof favParfum === "string" ? favParfum : favParfum?._id;
        return favId === parfum._id;
      });
      setIsFavorite(isInFavorites);
    } else {
      setIsFavorite(false);
    }
  }, [isAuthenticated, user?.favorisParfums, parfum?._id]);

  // ✅ Se resynchroniser si un autre composant modifie les favoris
  useEffect(() => {
    const onFavUpdate = () => {
      if (!user?.favorisParfums || !parfum?._id) return;
      const isInFavorites = user.favorisParfums.some((favParfum) => {
        const favId =
          typeof favParfum === "string" ? favParfum : favParfum?._id;
        return favId === parfum._id;
      });
      setIsFavorite(isInFavorites);
    };
    window.addEventListener("favorisUpdated", onFavUpdate);
    return () => window.removeEventListener("favorisUpdated", onFavUpdate);
  }, [user?.favorisParfums, parfum?._id]);

  const handleFavorite = async (e) => {
    e.stopPropagation(); // Empêche la navigation
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour ajouter aux favoris");
      return;
    }
    if (!parfum?._id) {
      toast.error("Erreur: données du parfum manquantes");
      return;
    }
    if (loading) return;

    setLoading(true);

    // ✅ Optimistic UI
    const previous = isFavorite;
    setIsFavorite(!isFavorite);

    try {
      if (previous) {
        await favoriAPI.removeParfum(parfum._id);
        toast.success(`${parfum.nom} retiré des favoris`);
      } else {
        await favoriAPI.addParfum(parfum._id);
        toast.success(`${parfum.nom} ajouté aux favoris !`);
      }
      window.dispatchEvent(new CustomEvent("favorisUpdated"));
    } catch (error) {
      // ❌ Rollback
      setIsFavorite(previous);
      const message =
        error?.response?.data?.message || "Erreur lors de la modification";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getGenreClass = (genre) => {
    switch ((genre || "").toLowerCase()) {
      case "homme":
        return "badge-genre badge-genre-homme";
      case "femme":
        return "badge-genre badge-genre-femme";
      case "mixte":
        return "badge-genre badge-genre-mixte";
      default:
        return "badge-genre";
    }
  };

  const handleNavigate = () => navigate(`/parfum/${parfum._id}`);

  return (
    <article
      className="card parfum-card cursor-pointer"
      onClick={handleNavigate}
      role="article"
    >
      <div className="card-image">
        <picture>
          <img
            src={imgSrc}
            alt={parfum?.nom || "Parfum"}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop";
            }}
          />
        </picture>

        {/* Badge genre */}
        {parfum?.genre && (
          <div className={getGenreClass(parfum.genre)}>{parfum.genre}</div>
        )}

        {/* Bouton favoris en overlay */}
        <button
          className={`fav-toggle ${isFavorite ? "is-active" : ""} ${
            loading ? "is-loading" : ""
          }`}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
          }
          onClick={handleFavorite}
          title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart className="fav-icon" />
        </button>
      </div>

      <div className="card-content">
        <h3 className="card-title">{parfum?.nom}</h3>
        <p className="card-subtitle">{parfum?.marque}</p>

        <div className="card-tags">
          {(parfum?.notes || []).slice(0, 3).map((note, i) => {
            const name = typeof note === "string" ? note : note?.nom;
            const key =
              typeof note === "string" ? note : note?._id || `${name}-${i}`;
            return (
              <span key={key} className={i === 0 ? "tag tag-primary" : "tag"}>
                {name}
              </span>
            );
          })}
        </div>

        <div className="card-actions">
          <button
            className="btn btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate();
            }}
          >
            Découvrir
          </button>
        </div>
      </div>
    </article>
  );
}
