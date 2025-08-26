import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Star,
  ShoppingBag,
  Share2,
  Eye,
  Clock,
  Sparkles,
} from "lucide-react";
import { parfumAPI, favoriAPI, historyAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import ParfumCard from "./ParfumCard";
import toast from "react-hot-toast";

export default function ParfumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [parfum, setParfum] = useState(null);
  const [similarParfums, setSimilarParfums] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données du parfum
  useEffect(() => {
    const loadParfumData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger le parfum principal
        const parfumResponse = await parfumAPI.getById(id);
        setParfum(parfumResponse.data);

        // Charger les parfums similaires
        try {
          const similarResponse = await parfumAPI.getSimilar(id);
          setSimilarParfums(similarResponse.data || []);
        } catch (err) {
          console.warn("Parfums similaires non disponibles");
        }

        // Ajouter à l'historique si connecté
        if (isAuthenticated) {
          try {
            await historyAPI.addToHistory(id);
          } catch (err) {
            console.warn("Erreur ajout historique");
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Parfum non trouvé");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadParfumData();
    }
  }, [id, isAuthenticated]);

  // Gérer les favoris
  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour ajouter des favoris");
      return;
    }

    try {
      if (isFavorite) {
        await favoriAPI.removeParfum(id);
        setIsFavorite(false);
        toast.success("Retiré des favoris");
      } else {
        await favoriAPI.addParfum(id);
        setIsFavorite(true);
        toast.success("Ajouté aux favoris !");
      }
    } catch (error) {
      toast.error("Erreur lors de la modification");
    }
  };

  // Partager le parfum
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${parfum.nom} - ${parfum.marque}`,
          text: `Découvrez ce parfum sur Scentify`,
          url: window.location.href,
        });
      } catch (err) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Lien copié dans le presse-papiers");
  };

  // Utilitaires
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
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "cœur":
        return "bg-pink-100 text-pink-800 border-pink-300";
      case "fond":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du parfum...</p>
        </div>
      </div>
    );
  }

  if (error || !parfum) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-gray-400 mb-6">
            <Eye className="w-20 h-20 mx-auto mb-4" />
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            Parfum non trouvé
          </h2>
          <p className="text-gray-500 mb-8">
            {error || "Ce parfum n'existe pas ou a été supprimé."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header avec navigation */}
      <div className="bg-white shadow-sm border-b sticky top-20 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Retour</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={toggleFavorite}
                className={`p-3 rounded-xl transition-all ${
                  isFavorite
                    ? "bg-red-50 text-red-600"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Section principale */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image et infos de base */}
          <div className="space-y-6">
            <div className="relative bg-white rounded-3xl p-8 shadow-lg">
              <img
                src={
                  parfum.photo ||
                  "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=600&fit=crop"
                }
                alt={parfum.nom}
                className="w-full max-w-sm h-96 object-cover rounded-2xl mx-auto shadow-lg"
              />

              {/* Badge genre */}
              <div
                className={`absolute top-4 left-4 bg-gradient-to-r ${getGenreColor(
                  parfum.genre
                )} text-white px-4 py-2 rounded-full font-semibold shadow-lg`}
              >
                {parfum.genre}
              </div>

              {/* Badge popularité */}
              {parfum.popularite > 80 && (
                <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-2 rounded-full text-sm font-bold flex items-center space-x-1 shadow-lg">
                  <Star className="w-4 h-4 fill-current" />
                  <span>Populaire</span>
                </div>
              )}
            </div>
          </div>

          {/* Détails du parfum */}
          <div className="space-y-8">
            {/* En-tête */}
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                {parfum.nom}
              </h1>
              <p className="text-2xl text-gray-600 font-semibold mb-4">
                {parfum.marque}
              </p>

              {parfum.popularite && (
                <div className="flex items-center space-x-2 mb-6">
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="font-semibold text-gray-800">
                      {parfum.popularite}
                    </span>
                    <span className="text-gray-600">/100</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">Note de popularité</span>
                </div>
              )}

              {parfum.description && (
                <p className="text-gray-700 text-lg leading-relaxed">
                  {parfum.description}
                </p>
              )}
            </div>

            {/* Notes olfactives */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-2 mb-6">
                <Sparkles className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Notes olfactives
                </h2>
              </div>

              <div className="space-y-6">
                {["tête", "cœur", "fond"].map((type) => {
                  const notesDeType =
                    parfum.notes?.filter((note) => note.type === type) || [];
                  if (notesDeType.length === 0) return null;

                  return (
                    <div key={type} className="border-l-4 border-red-200 pl-4">
                      <h3 className="font-bold text-lg text-gray-800 capitalize mb-3">
                        Notes de {type}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {notesDeType.map((note, index) => (
                          <span
                            key={index}
                            className={`px-4 py-2 rounded-xl text-sm font-medium border ${getNoteTypeColor(
                              type
                            )}`}
                          >
                            {note.nom}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Liens marchands */}
            {parfum.liensMarchands && parfum.liensMarchands.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center space-x-2 mb-6">
                  <ShoppingBag className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-800">
                    Où l'acheter
                  </h2>
                </div>

                <div className="space-y-3">
                  {parfum.liensMarchands.map((marchand, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="font-semibold text-gray-800">
                          {marchand.nom}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-bold text-gray-800">
                          {marchand.prix}€
                        </span>
                        <a
                          href={marchand.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                        >
                          Acheter
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Parfums similaires */}
        {similarParfums.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-8">
              <Clock className="w-6 h-6 text-red-500" />
              <h2 className="text-3xl font-bold text-gray-800">
                Parfums similaires
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {similarParfums.slice(0, 4).map((similarParfum) => (
                <ParfumCard key={similarParfum._id} parfum={similarParfum} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
