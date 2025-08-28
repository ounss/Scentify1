// frontend/src/components/AdvancedSearch.jsx - COMPOSANT COMPLET
import React, { useState, useEffect } from "react";
import { Search, X, Sparkles, TrendingUp, RefreshCw } from "lucide-react";
import { parfumAPI } from "../services/api";
import ParfumCard from "./ParfumCard";
import toast from "react-hot-toast";

export default function AdvancedSearch({ show, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedParfums, setSelectedParfums] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // ✅ RECHERCHE DE PARFUMS AVEC DEBOUNCE
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setLoadingSearch(true);
        try {
          const response = await parfumAPI.search(searchQuery);
          setSearchResults(response.data || []);
        } catch (error) {
          console.error("Erreur recherche:", error);
          setSearchResults([]);
        } finally {
          setLoadingSearch(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // ✅ GESTION SÉLECTION PARFUMS
  const handleSelectParfum = (parfum) => {
    const isAlreadySelected = selectedParfums.some((p) => p._id === parfum._id);

    if (isAlreadySelected) {
      setSelectedParfums((prev) => prev.filter((p) => p._id !== parfum._id));
      toast.info(`${parfum.nom} retiré de la sélection`);
    } else {
      if (selectedParfums.length >= 5) {
        toast.error("Maximum 5 parfums sélectionnables");
        return;
      }
      setSelectedParfums((prev) => [...prev, parfum]);
      toast.success(`${parfum.nom} ajouté à la sélection`);
    }
  };

  // ✅ OBTENIR RECOMMANDATIONS
  const handleGetRecommendations = async () => {
    if (selectedParfums.length < 2) {
      toast.error("Sélectionnez au moins 2 parfums");
      return;
    }

    setLoadingRecommendations(true);
    try {
      const parfumIds = selectedParfums.map((p) => p._id);
      const response = await parfumAPI.getBySimilarity(parfumIds, {
        limit: 12,
      });

      const recs = response.data.parfums || [];
      setRecommendations(recs);

      if (recs.length === 0) {
        toast.info("Aucune recommandation trouvée pour cette combinaison");
      } else {
        toast.success(`${recs.length} parfums similaires trouvés !`);
      }
    } catch (error) {
      console.error("Erreur recommendations:", error);
      toast.error("Erreur lors de la recherche de recommandations");
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // ✅ RESET
  const handleReset = () => {
    setSelectedParfums([]);
    setRecommendations([]);
    setSearchQuery("");
    setSearchResults([]);
    toast.info("Recherche réinitialisée");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
      <div className="h-full overflow-y-auto">
        <div className="min-h-full bg-white md:max-w-6xl md:mx-auto md:my-8 md:rounded-3xl">
          {/* ✅ HEADER */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 md:rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Recherche par Similarité
                  </h2>
                  <p className="text-gray-600">
                    Sélectionnez 2-5 parfums pour des recommandations
                    personnalisées
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* ✅ BARRE DE RECHERCHE */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher des parfums à ajouter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {loadingSearch && (
                  <RefreshCw className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                )}
              </div>
            </div>

            {/* ✅ PARFUMS SÉLECTIONNÉS */}
            {selectedParfums.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Parfums sélectionnés ({selectedParfums.length}/5)
                  </h3>
                  <button
                    onClick={handleReset}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Tout supprimer
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 mb-6">
                  {selectedParfums.map((parfum) => (
                    <div
                      key={parfum._id}
                      className="flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-xl"
                    >
                      <span className="font-medium">{parfum.nom}</span>
                      <span className="text-purple-600">• {parfum.marque}</span>
                      <button
                        onClick={() => handleSelectParfum(parfum)}
                        className="ml-2 hover:bg-purple-200 rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleGetRecommendations}
                  disabled={
                    selectedParfums.length < 2 || loadingRecommendations
                  }
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                >
                  {loadingRecommendations ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Recherche en cours...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5" />
                      <span>Trouver des parfums similaires</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ✅ RÉSULTATS RECHERCHE */}
            {searchResults.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Résultats de recherche
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {searchResults.slice(0, 12).map((parfum) => {
                    const isSelected = selectedParfums.some(
                      (p) => p._id === parfum._id
                    );
                    return (
                      <div
                        key={parfum._id}
                        className={`cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "ring-2 ring-purple-500 scale-105"
                            : "hover:scale-105"
                        }`}
                        onClick={() => handleSelectParfum(parfum)}
                      >
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md">
                          <img
                            src={
                              parfum.photo ||
                              "https://images.unsplash.com/photo-1541643600914-78b084683601?w=200&h=200&fit=crop"
                            }
                            alt={parfum.nom}
                            className="w-full aspect-square object-cover rounded-xl mb-3"
                          />
                          <h4 className="font-semibold text-sm text-gray-800 truncate">
                            {parfum.nom}
                          </h4>
                          <p className="text-xs text-gray-600 truncate">
                            {parfum.marque}
                          </p>
                          {isSelected && (
                            <div className="mt-2 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Sélectionné
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ✅ RECOMMANDATIONS */}
            {recommendations.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                  <h3 className="text-2xl font-bold text-gray-800">
                    Parfums recommandés pour vous
                  </h3>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6">
                  <p className="text-purple-800 text-center">
                    <strong>{recommendations.length}</strong> parfums trouvés
                    basés sur vos sélections. Ces recommandations partagent des
                    notes similaires avec vos parfums choisis.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {recommendations.map((parfum, index) => (
                    <div
                      key={parfum._id}
                      className="animate-fadeIn"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <ParfumCard parfum={parfum} />
                      {parfum.similarityScore && (
                        <div className="text-center mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {parfum.similarityPercentage}% de similarité
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ✅ ÉTAT VIDE INITIAL */}
            {selectedParfums.length === 0 &&
              searchResults.length === 0 &&
              !searchQuery && (
                <div className="text-center py-16">
                  <Sparkles className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-600 mb-4">
                    Découvrez des parfums similaires
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-8">
                    Utilisez la barre de recherche pour trouver vos parfums
                    préférés, puis sélectionnez-en plusieurs pour obtenir des
                    recommandations personnalisées.
                  </p>
                  <div className="bg-blue-50 rounded-xl p-4 max-w-md mx-auto">
                    <p className="text-blue-800 text-sm">
                      💡 <strong>Astuce :</strong> Plus vous sélectionnez de
                      parfums, plus les recommandations seront précises !
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
