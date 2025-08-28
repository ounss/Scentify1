// frontend/src/components/ParfumCard.jsx - CORRECTION FAVORIS
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { favoriAPI } from "../services/api";
import toast from "react-hot-toast";

export default function ParfumCard({ parfum }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth(); // ✅ RETIRÉ refreshUser
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  // ✅ CORRECTION CRITIQUE - Sans refreshUser dans les dépendances
  useEffect(() => {
    if (user?.favorisParfums && parfum?._id) {
      const isInFavorites = user.favorisParfums.some((fav) => {
        const favId = typeof fav === "string" ? fav : fav?._id;
        return favId === parfum._id;
      });

      console.log(`🔍 Vérification favori pour ${parfum.nom}:`, {
        parfumId: parfum._id,
        userFavoris: user.favorisParfums.length,
        isInFavorites,
      });

      setIsFavorite(isInFavorites);
    } else {
      setIsFavorite(false);
    }
  }, [user?.favorisParfums, parfum?._id]); // ✅ SANS refreshUser

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Connectez-vous pour gérer vos favoris");
      navigate("/auth");
      return;
    }

    if (!parfum?._id) {
      toast.error("Erreur: ID du parfum manquant");
      return;
    }

    if (isLoadingFavorite) return;

    setIsLoadingFavorite(true);

    // ✅ OPTIMISATION - Mise à jour optimiste de l'UI
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);

    try {
      console.log(
        `🔄 ${isFavorite ? "Suppression" : "Ajout"} favori pour:`,
        parfum.nom
      );

      if (previousState) {
        await favoriAPI.removeParfum(parfum._id);
        toast.success(`${parfum.nom} retiré des favoris`);
      } else {
        await favoriAPI.addParfum(parfum._id);
        toast.success(`${parfum.nom} ajouté aux favoris !`);
      }

      console.log("✅ Action favori réussie");

      // ✅ AMÉLIORATION - Déclencher un événement custom pour mettre à jour le contexte
      window.dispatchEvent(
        new CustomEvent("favorisUpdated", {
          detail: {
            parfumId: parfum._id,
            action: previousState ? "remove" : "add",
          },
        })
      );
    } catch (error) {
      console.error("❌ Erreur favoris:", error);

      // ✅ ROLLBACK - Revenir à l'état précédent en cas d'erreur
      setIsFavorite(previousState);

      if (error.response?.status === 401) {
        toast.error("Session expirée, reconnectez-vous");
        navigate("/auth");
      } else if (error.response?.status === 404) {
        toast.error("Parfum non trouvé");
      } else {
        const message =
          error.response?.data?.message || "Erreur lors de la modification";
        toast.error(message);
      }
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  const handleDiscover = (e) => {
    e.preventDefault();

    if (!parfum?._id) {
      toast.error("Erreur: Données du parfum manquantes");
      return;
    }

    console.log("🔍 Navigation vers:", `/parfum/${parfum._id}`);
    navigate(`/parfum/${parfum._id}`);
  };

  // ✅ Guard clause
  if (!parfum) {
    console.warn("⚠️ ParfumCard: parfum data missing");
    return null;
  }

  return (
    <article className="card fade-in">
      <div className="card-image">
        <img
          src={
            parfum.photo ||
            "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop"
          }
          alt={parfum.nom || "Parfum"}
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop";
          }}
        />
        <span className="card-badge">{parfum.genre}</span>
      </div>

      <div className="card-content">
        <h3 className="card-title">{parfum.nom}</h3>
        <p className="card-subtitle">{parfum.marque}</p>

        <div className="card-tags">
          {parfum.notes?.slice(0, 3).map((note, index) => (
            <span
              key={note._id || index}
              className={index === 0 ? "tag tag-primary" : "tag"}
            >
              {note.nom}
            </span>
          ))}
        </div>

        <div className="flex-between mt-1">
          <button
            className={`btn btn-icon btn-secondary ${
              isLoadingFavorite ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleFavoriteToggle}
            disabled={isLoadingFavorite}
            type="button"
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart
              className={`w-5 h-5 transition-all duration-200 ${
                isFavorite
                  ? "fill-current text-red-500 scale-110"
                  : "text-gray-400 hover:text-red-400"
              } ${isLoadingFavorite ? "animate-pulse" : ""}`}
            />
          </button>

          <button
            className="btn btn-primary"
            onClick={handleDiscover}
            type="button"
          >
            Découvrir
          </button>
        </div>
      </div>
    </article>
  );
}
