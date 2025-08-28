import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { favoriAPI } from "../services/api";
import toast from "react-hot-toast";

export default function ParfumCard({ parfum }) {
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshUser } = useAuth(); // ✅ Ajout refreshUser
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false); // ✅ État de chargement

  // ✅ Vérifier si le parfum est en favori avec une logique plus robuste
  useEffect(() => {
    if (user?.favorisParfums && parfum?._id) {
      const isInFavorites = user.favorisParfums.some((fav) => {
        // Gérer les cas où fav peut être un string ou un objet
        const favId = typeof fav === "string" ? fav : fav?._id;
        return favId === parfum._id;
      });

      console.log(`🔍 Vérification favori pour ${parfum.nom}:`, {
        parfumId: parfum._id,
        userFavoris: user.favorisParfums,
        isInFavorites,
      });

      setIsFavorite(isInFavorites);
    } else {
      setIsFavorite(false);
    }
  }, [user?.favorisParfums, parfum?._id]);

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

    if (isLoadingFavorite) {
      return; // ✅ Empêcher les clics multiples
    }

    setIsLoadingFavorite(true);

    try {
      console.log(
        `🔄 ${isFavorite ? "Suppression" : "Ajout"} favori pour:`,
        parfum.nom
      );

      if (isFavorite) {
        await favoriAPI.removeParfum(parfum._id);
        setIsFavorite(false);
        toast.success(`${parfum.nom} retiré des favoris`);
        console.log("✅ Parfum retiré des favoris");
      } else {
        await favoriAPI.addParfum(parfum._id);
        setIsFavorite(true);
        toast.success(`${parfum.nom} ajouté aux favoris !`);
        console.log("✅ Parfum ajouté aux favoris");
      }

      // ✅ Recharger le profil utilisateur pour mettre à jour les favoris
      await refreshUser();
    } catch (error) {
      console.error("❌ Erreur favoris:", error);

      // ✅ Gestion d'erreur plus spécifique
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

      // ✅ Revenir à l'état précédent en cas d'erreur
      setIsFavorite(!isFavorite);
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

  // ✅ Vérification des données du parfum
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
              isLoadingFavorite ? "opacity-50" : ""
            }`}
            onClick={handleFavoriteToggle}
            disabled={isLoadingFavorite} // ✅ Désactiver pendant le chargement
            type="button"
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart
              className={`w-5 h-5 transition-all ${
                isFavorite
                  ? "fill-current text-red-500"
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
