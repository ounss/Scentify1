// frontend/src/pages/FavoritesPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Search } from "lucide-react";
import { favoritesAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import ParfumCard from "../components/ParfumCard";
import ScentifyLogo from "../components/ScentifyLogo";

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState({ parfums: [], notes: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("parfums");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    loadFavorites();
  }, [isAuthenticated, navigate]);

  const loadFavorites = async () => {
    try {
      const response = await favoritesAPI.getFavorites();
      setFavorites(response.data);
    } catch (error) {
      console.error("Erreur chargement favoris:", error);
    } finally {
      setLoading(false);
    }
  };

  const EmptyFavorites = () => (
    <div className="text-center py-16">
      <Heart className="w-20 h-20 text-gray-200 mx-auto mb-6" />
      <h3 className="text-xl font-bold text-gray-600 mb-4">
        Aucun favori pour le moment
      </h3>
      <p className="text-gray-500 mb-8 px-4">
        Explorez notre collection et ajoutez vos parfums préférés
      </p>
      <button
        onClick={() => navigate("/")}
        className="bg-red-600 text-white px-8 py-3 rounded-xl font-semibold"
      >
        Découvrir des parfums
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des favoris...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <ScentifyLogo size={24} className="text-red-500" />
            <div className="w-9"></div>
          </div>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans mes favoris..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("parfums")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === "parfums"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Historique ({favorites.parfums.length})
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === "notes"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Favoris ({favorites.notes.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 pb-20">
        {activeTab === "parfums" ? (
          favorites.parfums.length > 0 ? (
            <div className="space-y-4">
              {favorites.parfums.map((parfum) => (
                <div
                  key={parfum._id}
                  className="bg-white rounded-2xl p-4 shadow-sm border"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={
                        parfum.photo ||
                        "https://res.cloudinary.com/dyxmkgpgp/image/upload/v1756928420/parfum-en-bouteille-noire-sur-la-table_ixbh79.jpg"
                      }
                      alt={parfum.nom}
                      className="w-16 h-16 object-cover rounded-xl"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {parfum.nom}
                      </h3>
                      <p className="text-gray-600 text-sm">{parfum.marque}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            parfum.genre === "homme"
                              ? "bg-blue-100 text-blue-800"
                              : parfum.genre === "femme"
                              ? "bg-pink-100 text-pink-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {parfum.genre}
                        </span>
                      </div>
                    </div>
                    <button className="p-2 text-red-500">
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyFavorites />
          )
        ) : // Notes favorites
        favorites.notes.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {favorites.notes.map((note) => (
              <div
                key={note._id}
                className="bg-white rounded-xl p-4 shadow-sm border"
              >
                <h3 className="font-semibold text-gray-800 text-sm">
                  {note.nom}
                </h3>
                <span
                  className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                    note.type === "tête"
                      ? "bg-yellow-100 text-yellow-800"
                      : note.type === "cœur"
                      ? "bg-pink-100 text-pink-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {note.type}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyFavorites />
        )}
      </div>
    </div>
  );
}
