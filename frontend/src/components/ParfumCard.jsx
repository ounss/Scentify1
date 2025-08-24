import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star, ShoppingBag, Eye } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { favoriAPI, historyAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function ParfumCard({ parfum }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCardClick = async () => {
    // Ajouter à l'historique si connecté
    if (isAuthenticated) {
      try {
        await historyAPI.addToHistory(parfum._id);
      } catch (error) {
        console.error("Erreur ajout historique:", error);
      }
    }
    navigate(`/parfum/${parfum._id}`);
  };

  const toggleFavorite = async (e) => {
    e.stopPropagation(); // Empêcher la navigation

    if (!isAuthenticated) {
      toast.error("Connectez-vous pour ajouter des favoris");
      return;
    }

    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const getGenreColor = (genre) => {
    switch (genre) {
      case "homme":
        return "from-blue-500 to-indigo-500";
      case "femme":
        return "from-pink-500 to-rose-500";
      case "mixte":
        return "from-purple-500 to-violet-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getNoteTypeColor = (type) => {
    switch (type) {
      case "tête":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cœur":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "fond":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div
      className="group bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl border border-gray-100"
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={
            parfum.photo ||
            "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=500&fit=crop"
          }
          alt={parfum.nom}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Badge genre */}
        <div
          className={`absolute top-4 left-4 bg-gradient-to-r ${getGenreColor(
            parfum.genre
          )} text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg`}
        >
          {parfum.genre}
        </div>

        {/* Bouton favoris */}
        <button
          onClick={toggleFavorite}
          disabled={isLoading}
          className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-sm transition-all duration-300 ${
            isFavorite
              ? "bg-red-500 text-white shadow-lg"
              : "bg-white/80 text-gray-600 hover:bg-white hover:text-red-500"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
        </button>

        {/* Badge popularité */}
        {parfum.popularite > 80 && (
          <div className="absolute bottom-4 left-4 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
            <Star className="w-3 h-3 fill-current" />
            <span>Populaire</span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-red-600 transition-colors">
            {parfum.nom}
          </h3>
          <p className="text-gray-600 font-medium">{parfum.marque}</p>
        </div>

        {/* Notes olfactives */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Notes principales :
          </p>
          <div className="flex flex-wrap gap-2">
            {parfum.notes?.slice(0, 3).map((note, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getNoteTypeColor(
                  note.type
                )}`}
              >
                {note.nom}
              </span>
            ))}
            {parfum.notes?.length > 3 && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                +{parfum.notes.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Footer card */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {parfum.popularite && (
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-semibold text-gray-700">
                  {parfum.popularite}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {parfum.liensMarchands?.length > 0 && (
              <div className="flex items-center space-x-1 text-green-600">
                <ShoppingBag className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {parfum.liensMarchands.length} shop
                  {parfum.liensMarchands.length > 1 ? "s" : ""}
                </span>
              </div>
            )}

            <div className="flex items-center space-x-1 text-gray-500 group-hover:text-red-500 transition-colors">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">Voir</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
