// frontend/src/components/ParfumDetail.jsx - CORRECTION HISTORIQUE ET AFFICHAGE
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
  const { isAuthenticated, user } = useAuth();

  const [parfum, setParfum] = useState(null);
  const [similarParfums, setSimilarParfums] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // ✅ CHARGEMENT DU PARFUM AVEC AJOUT AUTOMATIQUE À L'HISTORIQUE
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

        // ✅ 1. Charger le parfum principal
        const parfumResponse = await parfumAPI.getById(id);
        const parfumData = parfumResponse.data;
        setParfum(parfumData);

        // ✅ 2. AJOUT AUTOMATIQUE À L'HISTORIQUE si connecté
        if (isAuthenticated) {
          try {
            await historyAPI.addToHistory(id);
            // ✅ Déclencher événement pour mise à jour contexte
            window.dispatchEvent(
              new CustomEvent("historyUpdated", {
                detail: { parfum: parfumData },
              })
            );
          } catch (histErr) {
            console.warn(
              "⚠️ Erreur ajout historique (non bloquant):",
              histErr?.message || histErr
            );
          }
        }

        // ✅ 3. Charger les parfums similaires (optionnel)
        try {
          const similarResponse = await parfumAPI.getSimilar(id);
          setSimilarParfums(similarResponse.data || []);
        } catch (err) {
          console.warn(
            "⚠️ Parfums similaires non disponibles:",
            err?.message || err
          );
          setSimilarParfums([]);
        }
      } catch (err) {
        console.error("❌ Erreur chargement parfum:", err);
        setError(
          err?.response?.status === 404
            ? "Parfum non trouvé"
            : err?.response?.data?.message || "Erreur lors du chargement"
        );
      } finally {
        setLoading(false);
      }
    };

    loadParfumData();
  }, [id, isAuthenticated]);

  // ✅ Vérifier si le parfum est en favori (sur base du contexte utilisateur)
  useEffect(() => {
    if (user?.favorisParfums && parfum?._id) {
      const isInFavorites = user.favorisParfums.some((fav) => {
        const favId = typeof fav === "string" ? fav : fav?._id;
        return favId === parfum._id;
      });
      setIsFavorite(isInFavorites);
    } else {
      setIsFavorite(false);
    }
  }, [user?.favorisParfums, parfum?._id]);

  // ✅ GESTION FAVORIS
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

    // ✅ Mise à jour optimiste UI
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);

    try {
      if (previousState) {
        await favoriAPI.removeParfum(parfum._id);
        toast.success(`${parfum.nom} retiré des favoris`);
      } else {
        await favoriAPI.addParfum(parfum._id);
        toast.success(`${parfum.nom} ajouté aux favoris !`);
      }

      // ✅ Déclencher événement pour mise à jour contexte
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

      // ✅ Rollback UI en cas d'erreur
      setIsFavorite(previousState);

      if (error?.response?.status === 401) {
        toast.error("Session expirée, reconnectez-vous");
        navigate("/auth");
      } else {
        const message =
          error?.response?.data?.message || "Erreur lors de la modification";
        toast.error(message);
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  // ✅ PARTAGE
  const handleShare = async () => {
    if (!parfum) return;

    const shareData = {
      title: `${parfum.nom} - ${parfum.marque}`,
      text: `Découvrez ce parfum sur Scentify`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err?.name !== "AbortError") {
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

  // ✅ UTILITAIRES UI
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

  const formatPrix = (lien) => {
    if (!lien?.prix && !lien?.prixOriginal) return null;

    if (lien?.enPromotion && lien?.prixOriginal) {
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
      prix: lien?.prix ? `${lien.prix}€` : undefined,
      isPromo: false,
    };
  };

  // ✅ LOADING STATE
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

  // ✅ ERROR STATE
  if (error || !parfum) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-gray-400 mb-6">
            <Eye className="w-20 h-20 mx-auto mb-4" />
          </div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            {error || "Parfum non trouvé"}
          </h2>
          <p className="text-gray-500 mb-8">
            Ce parfum n'existe pas ou a été supprimé.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
            >
              Retour
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              Accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* ✅ HEADER AVEC NAVIGATION */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
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
        {/* ✅ SECTION PRINCIPALE */}
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
                  e.currentTarget.src =
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

            {/* Info rapides */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow">
                <div className="text-sm text-gray-500">Marque</div>
                <div className="font-semibold text-gray-800">
                  {parfum.marque}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow">
                <div className="text-sm text-gray-500">Genre</div>
                <div className="font-semibold capitalize text-gray-800">
                  {parfum.genre}
                </div>
              </div>
            </div>
          </div>

          {/* ✅ DÉTAILS DU PARFUM */}
          <div className="space-y-8">
            {/* En-tête */}
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                {parfum.nom}
              </h1>
              <p className="text-2xl text-gray-600 font-semibold mb-4">
                {parfum.marque}
              </p>

              {parfum.popularite > 0 && (
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

            {/* ✅ NOTES OLFACTIVES */}
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

            {/* ✅ LIENS MARCHANDS */}
            {parfum.liensMarchands && parfum.liensMarchands.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
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
                    .filter((lien) => lien?.disponible !== false)
                    .map((marchand, index) => {
                      const prixInfo = formatPrix(marchand);

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                              <ShoppingBag className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">
                                  {marchand?.nom ||
                                    marchand?.site ||
                                    "Boutique"}
                                </span>
                                {marchand?.label && (
                                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                                    {marchand.label}
                                  </span>
                                )}
                              </div>
                              {marchand?.format && (
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Tag className="w-4 h-4" /> {marchand.format}
                                </div>
                              )}
                              {marchand?.delaiLivraison && (
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Truck className="w-4 h-4" />{" "}
                                  {marchand.delaiLivraison}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {prixInfo?.isPromo ? (
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  {prixInfo.prix}
                                </div>
                                <div className="text-sm text-gray-500 line-through">
                                  {prixInfo.prixOriginal}
                                </div>
                                <div className="text-xs text-green-700 font-semibold">
                                  -{prixInfo.reduction}
                                </div>
                              </div>
                            ) : (
                              <div className="text-right">
                                {prixInfo?.prix ? (
                                  <div className="text-lg font-bold text-gray-900">
                                    {prixInfo.prix}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500">
                                    Prix non communiqué
                                  </div>
                                )}
                              </div>
                            )}

                            {marchand?.url && (
                              <a
                                href={marchand.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                              >
                                Voir l'offre{" "}
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Disclaimer prix */}
                <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Les prix et disponibilités sont indicatifs et peuvent varier
                  selon les boutiques.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ✅ SECTION SIMILAIRES */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              Parfums similaires
            </h2>
          </div>

          {similarParfums?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {similarParfums.map((p) => (
                <ParfumCard key={p._id} parfum={p} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-gray-600 shadow">
              Aucun parfum similaire trouvé pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
