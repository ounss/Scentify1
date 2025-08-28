// frontend/src/components/ParfumDetail.jsx - CORRECTION HISTORIQUE
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
  ExternalLink,
  Tag,
  Truck,
} from "lucide-react";
import { parfumAPI, favoriAPI, historyAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import ParfumCard from "./ParfumCard";
import toast from "react-hot-toast";

export default function ParfumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, addToHistory } = useAuth();

  const [parfum, setParfum] = useState(null);
  const [similarParfums, setSimilarParfums] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  console.log("🔍 ParfumDetail ID:", id);

  // ✅ CORRECTION HISTORIQUE - Charger les données du parfum
  useEffect(() => {
    const loadParfumData = async () => {
      if (!id) {
        setError("ID de parfum manquant");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("📦 Chargement du parfum:", id);

        // ✅ 1. Charger le parfum principal
        const parfumResponse = await parfumAPI.getById(id);
        console.log("✅ Parfum reçu:", parfumResponse.data);
        setParfum(parfumResponse.data);

        // ✅ 2. AJOUTER À L'HISTORIQUE IMMÉDIATEMENT (CORRECTION PRINCIPALE)
        if (isAuthenticated) {
          try {
            console.log("📖 Ajout à l'historique...");
            await historyAPI.addToHistory(id);
            console.log("✅ Ajouté à l'historique");

            // ✅ Mettre à jour le contexte via événement personnalisé
            window.dispatchEvent(
              new CustomEvent("historyUpdated", {
                detail: { parfum: parfumResponse.data },
              })
            );
          } catch (histErr) {
            console.warn("⚠️ Erreur ajout historique (non critique):", histErr);
            // Ne pas faire échouer le chargement pour ça
          }
        }

        // ✅ 3. Charger les parfums similaires (optionnel)
        try {
          const similarResponse = await parfumAPI.getSimilar(id);
          setSimilarParfums(similarResponse.data || []);
          console.log(
            "🔗 Parfums similaires:",
            similarResponse.data?.length || 0
          );
        } catch (err) {
          console.warn("⚠️ Parfums similaires non disponibles:", err);
        }
      } catch (err) {
        console.error("❌ Erreur chargement parfum:", err);
        setError(err.response?.data?.message || "Parfum non trouvé");
      } finally {
        setLoading(false);
      }
    };

    loadParfumData();
  }, [id, isAuthenticated]); // ✅ Dépendances simplifiées

  // ✅ Vérifier si le parfum est en favori
  useEffect(() => {
    if (user?.favorisParfums && parfum?._id) {
      const isInFavorites = user.favorisParfums.some((fav) => {
        const favId = typeof fav === "string" ? fav : fav?._id;
        return favId === parfum._id;
      });

      console.log("💝 Vérification favori:", {
        parfumId: parfum._id,
        isInFavorites,
        userFavoris: user.favorisParfums?.length || 0,
      });

      setIsFavorite(isInFavorites);
    } else {
      setIsFavorite(false);
    }
  }, [user?.favorisParfums, parfum?._id]);

  // ✅ Gérer les favoris
  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour ajouter des favoris");
      navigate("/auth");
      return;
    }

    if (!parfum?._id) {
      toast.error("Erreur: données du parfum manquantes");
      return;
    }

    if (favoriteLoading) return;

    setFavoriteLoading(true);

    // ✅ Optimisation - Mise à jour optimiste
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);

    try {
      console.log(
        `💝 ${previousState ? "Suppression" : "Ajout"} favori:`,
        parfum.nom
      );

      if (previousState) {
        await favoriAPI.removeParfum(parfum._id);
        toast.success(`${parfum.nom} retiré des favoris`);
      } else {
        await favoriAPI.addParfum(parfum._id);
        toast.success(`${parfum.nom} ajouté aux favoris !`);
      }

      // ✅ Déclencher événement pour mettre à jour le contexte
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

      // ✅ Rollback en cas d'erreur
      setIsFavorite(previousState);

      if (error.response?.status === 401) {
        toast.error("Session expirée, reconnectez-vous");
        navigate("/auth");
      } else {
        const message =
          error.response?.data?.message || "Erreur lors de la modification";
        toast.error(message);
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  // ✅ Partager le parfum
  const handleShare = async () => {
    if (!parfum) return;

    const shareData = {
      title: `${parfum.nom} - ${parfum.marque}`,
      text: `Découvrez ce parfum sur Scentify`,
      url: window.location.href,
    };

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== "AbortError") {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié dans le presse-papiers");
    } catch (err) {
      console.error("Erreur copie:", err);
      toast.error("Impossible de copier le lien");
    }
  };

  // ✅ Utilitaires couleurs
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

  // ✅ Formatage prix avec réduction
  const formatPrix = (lien) => {
    if (!lien.prix) return null;

    if (lien.enPromotion && lien.prixOriginal) {
      const reduction = Math.round(
        ((lien.prixOriginal - lien.prix) / lien.prixOriginal) * 100
      );
      return {
        prix: `${lien.prix}€`,
        prixOriginal: `${lien.prixOriginal}€`,
        reduction: `${reduction}%`,
        isPromo: true,
      };
    }

    return {
      prix: `${lien.prix}€`,
      isPromo: false,
    };
  };

  // ✅ États de chargement et erreur
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du parfum...</p>
        </div>
      </div>
    );
  }

  if (error || !parfum) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
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
                title="Partager"
              >
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>

              <button
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                className={`p-3 rounded-xl transition-all ${
                  isFavorite
                    ? "bg-red-50 text-red-600"
                    : "hover:bg-gray-100 text-gray-600"
                } ${favoriteLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                title={
                  isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
                }
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? "fill-current" : ""} ${
                    favoriteLoading ? "animate-pulse" : ""
                  }`}
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
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=600&fit=crop";
                }}
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
            {parfum.notes && parfum.notes.length > 0 && (
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
                      <div
                        key={type}
                        className="border-l-4 border-red-200 pl-4"
                      >
                        <h3 className="font-bold text-lg text-gray-800 capitalize mb-3">
                          Notes de {type}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {notesDeType.map((note, index) => (
                            <span
                              key={note._id || index}
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
            )}

            {/* ✅ LIENS MARCHANDS AMÉLIORÉS */}
            {parfum.liensMarchands && parfum.liensMarchands.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center space-x-2 mb-6">
                  <ShoppingBag className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-800">
                    Où l'acheter
                  </h2>
                  {parfum.meilleurPrix && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      À partir de {parfum.meilleurPrix}€
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {parfum.liensMarchands
                    .filter((lien) => lien.disponible)
                    .map((marchand, index) => {
                      const prixInfo = formatPrix(marchand);

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                              <ShoppingBag className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-800">
                                  {marchand.nom}
                                </span>
                                {marchand.enPromotion && (
                                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                                    PROMO -{prixInfo.reduction}
                                  </span>
                                )}
                              </div>

                              {marchand.taille && (
                                <span className="text-sm text-gray-600">
                                  {marchand.taille}
                                </span>
                              )}

                              {marchand.delaiLivraison && (
                                <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                                  <Truck className="w-3 h-3" />
                                  <span>{marchand.delaiLivraison}</span>
                                  {marchand.fraisLivraison === 0 && (
                                    <span className="text-green-600 font-medium">
                                      • Livraison gratuite
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              {prixInfo?.isPromo ? (
                                <div>
                                  <div className="text-2xl font-bold text-red-600">
                                    {prixInfo.prix}
                                  </div>
                                  <div className="text-sm text-gray-500 line-through">
                                    {prixInfo.prixOriginal}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-2xl font-bold text-gray-800">
                                  {prixInfo?.prix || "Prix non disponible"}
                                </div>
                              )}

                              {marchand.noteQualite && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  <span className="text-sm text-gray-600">
                                    {marchand.noteQualite}/5
                                  </span>
                                </div>
                              )}
                            </div>

                            <a
                              href={marchand.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
                            >
                              <span>Acheter</span>
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* ✅ Liens non disponibles */}
                {parfum.liensMarchands.some((lien) => !lien.disponible) && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-xl border border-orange-200">
                    <p className="text-orange-800 text-sm">
                      <span className="font-medium">Note :</span> Certains
                      marchands peuvent être temporairement indisponibles.
                    </p>
                  </div>
                )}
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
