import React, { useState, useEffect } from "react";
import {
  Search,
  Heart,
  User,
  Home,
  Filter,
  Star,
  ShoppingBag,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";

const ScentifyApp = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParfum, setSelectedParfum] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [parfums, setParfums] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ genre: "tous", type: "tous" });

  // Données de démonstration
  const mockParfums = [
    {
      id: 1,
      nom: "Sauvage",
      marque: "Dior",
      genre: "homme",
      photo:
        "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=400&fit=crop",
      notes: [
        { nom: "Bergamote", type: "tête" },
        { nom: "Lavande", type: "cœur" },
        { nom: "Ambroxan", type: "fond" },
      ],
      popularite: 95,
      liensMarchands: [
        { nom: "Sephora", url: "#", prix: 89 },
        { nom: "Douglas", url: "#", prix: 85 },
      ],
    },
    {
      id: 2,
      nom: "La Vie est Belle",
      marque: "Lancôme",
      genre: "femme",
      photo:
        "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&h=400&fit=crop",
      notes: [
        { nom: "Cassis", type: "tête" },
        { nom: "Jasmin", type: "cœur" },
        { nom: "Vanille", type: "fond" },
      ],
      popularite: 92,
      liensMarchands: [
        { nom: "Sephora", url: "#", prix: 79 },
        { nom: "Marionnaud", url: "#", prix: 75 },
      ],
    },
    {
      id: 3,
      nom: "Tom Ford Black Orchid",
      marque: "Tom Ford",
      genre: "mixte",
      photo:
        "https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?w=300&h=400&fit=crop",
      notes: [
        { nom: "Truffe", type: "tête" },
        { nom: "Orchidée", type: "cœur" },
        { nom: "Patchouli", type: "fond" },
      ],
      popularite: 88,
      liensMarchands: [
        { nom: "Sephora", url: "#", prix: 145 },
        { nom: "Galeries Lafayette", url: "#", prix: 140 },
      ],
    },
  ];

  const mockNotes = [
    {
      id: 1,
      nom: "Bergamote",
      type: "tête",
      description: "Agrume frais et pétillant",
    },
    {
      id: 2,
      nom: "Lavande",
      type: "cœur",
      description: "Fleur aromatique et apaisante",
    },
    {
      id: 3,
      nom: "Vanille",
      type: "fond",
      description: "Gourmand et chaleureux",
    },
    {
      id: 4,
      nom: "Jasmin",
      type: "cœur",
      description: "Fleur blanche sensuelle",
    },
    {
      id: 5,
      nom: "Ambroxan",
      type: "fond",
      description: "Ambre moderne et clean",
    },
  ];

  useEffect(() => {
    setParfums(mockParfums);
    setNotes(mockNotes);
  }, []);

  const filteredParfums = parfums.filter((parfum) => {
    const matchesSearch =
      parfum.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parfum.marque.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre =
      filters.genre === "tous" || parfum.genre === filters.genre;
    return matchesSearch && matchesGenre;
  });

  const ParfumCard = ({ parfum, onClick }) => (
    <div
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
      onClick={() => onClick(parfum)}
    >
      <div className="relative">
        <img
          src={parfum.photo}
          alt={parfum.nom}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2">
          <Heart className="w-5 h-5 text-gray-600" />
        </div>
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-white text-sm font-medium">{parfum.genre}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-800 mb-1">{parfum.nom}</h3>
        <p className="text-gray-600 text-sm mb-2">{parfum.marque}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm text-gray-600">
              {parfum.popularite}/100
            </span>
          </div>
          <div className="flex -space-x-2">
            {parfum.notes.slice(0, 3).map((note, index) => (
              <div
                key={index}
                className={`w-6 h-6 rounded-full border-2 border-white ${
                  note.type === "tête"
                    ? "bg-yellow-400"
                    : note.type === "cœur"
                    ? "bg-pink-400"
                    : "bg-purple-400"
                }`}
                title={note.nom}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const ParfumDetail = ({ parfum, onClose }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <div className="bg-white w-full max-h-[90vh] rounded-t-3xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="font-bold text-xl">Détails du parfum</h2>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Heart className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <img
              src={parfum.photo}
              alt={parfum.nom}
              className="w-40 h-52 object-cover rounded-2xl mx-auto mb-4 shadow-lg"
            />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {parfum.nom}
            </h1>
            <p className="text-lg text-gray-600 mb-2">{parfum.marque}</p>
            <span className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
              {parfum.genre}
            </span>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3">Notes olfactives</h3>
            <div className="space-y-3">
              {["tête", "cœur", "fond"].map((type) => {
                const notesDeType = parfum.notes.filter(
                  (note) => note.type === type
                );
                if (notesDeType.length === 0) return null;

                return (
                  <div key={type} className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        type === "tête"
                          ? "bg-yellow-400"
                          : type === "cœur"
                          ? "bg-pink-400"
                          : "bg-purple-400"
                      }`}
                    >
                      {type === "tête" ? "T" : type === "cœur" ? "C" : "F"}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 capitalize">
                        {type}
                      </p>
                      <p className="text-sm text-gray-600">
                        {notesDeType.map((note) => note.nom).join(", ")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3">Où l'acheter</h3>
            <div className="space-y-3">
              {parfum.liensMarchands.map((marchand, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <ShoppingBag className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-800">
                      {marchand.nom}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-lg text-gray-800">
                      {marchand.prix}€
                    </span>
                    <button className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-700 transition-colors">
                      Voir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const FilterModal = ({ show, onClose }) => {
    if (!show) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
        <div className="bg-white w-full max-h-[70vh] rounded-t-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Filtres</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Genre</h3>
              <div className="grid grid-cols-2 gap-3">
                {["tous", "homme", "femme", "mixte"].map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setFilters((prev) => ({ ...prev, genre }))}
                    className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                      filters.genre === genre
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setFilters({ genre: "tous", type: "tous" });
                  onClose();
                }}
                className="flex-1 p-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
              >
                Réinitialiser
              </button>
              <button
                onClick={onClose}
                className="flex-1 p-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const HomeScreen = () => (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Scentify</h1>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un parfum ou une note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowFilters(true)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            >
              <Filter className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Quick Categories */}
        <div className="mb-6">
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {["Populaires", "Homme", "Femme", "Mixte", "Nouveautés"].map(
              (category) => (
                <button
                  key={category}
                  className="whitespace-nowrap px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  {category}
                </button>
              )
            )}
          </div>
        </div>

        {/* Parfums Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredParfums.map((parfum) => (
            <ParfumCard
              key={parfum.id}
              parfum={parfum}
              onClick={setSelectedParfum}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const SearchScreen = () => (
    <div className="p-4 pb-20">
      <h2 className="text-xl font-bold mb-4">Recherche avancée</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Rechercher par nom
          </label>
          <input
            type="text"
            placeholder="Nom du parfum..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Rechercher par note
          </label>
          <div className="grid grid-cols-2 gap-2">
            {notes.slice(0, 6).map((note) => (
              <button
                key={note.id}
                className="p-3 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium">{note.nom}</div>
                <div className="text-sm text-gray-600 capitalize">
                  {note.type}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const FavoritesScreen = () => (
    <div className="p-4 pb-20">
      <h2 className="text-xl font-bold mb-4">Mes favoris</h2>
      <div className="text-center py-12">
        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Aucun favori pour le moment</p>
        <p className="text-gray-400 text-sm mt-2">
          Ajoutez des parfums à vos favoris pour les retrouver ici
        </p>
      </div>
    </div>
  );

  const ProfileScreen = () => (
    <div className="p-4 pb-20">
      <h2 className="text-xl font-bold mb-4">Mon profil</h2>
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Connectez-vous</p>
        <p className="text-gray-400 text-sm mt-2">
          Accédez à vos favoris et votre historique
        </p>
        <button className="mt-4 bg-red-600 text-white px-6 py-2 rounded-full font-medium hover:bg-red-700 transition-colors">
          Se connecter
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ backgroundColor: "#f1e0cc" }}
    >
      {/* Main Content */}
      {activeTab === "home" && <HomeScreen />}
      {activeTab === "search" && <SearchScreen />}
      {activeTab === "favorites" && <FavoritesScreen />}
      {activeTab === "profile" && <ProfileScreen />}

      {/* Bottom Navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t"
        style={{ backgroundColor: "#2c2c2c" }}
      >
        <div className="flex justify-around py-2">
          {[
            { id: "home", icon: Home, label: "Accueil" },
            { id: "search", icon: Search, label: "Recherche" },
            { id: "favorites", icon: Heart, label: "Favoris" },
            { id: "profile", icon: User, label: "Profil" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <tab.icon className="w-6 h-6 mb-1" />
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      {selectedParfum && (
        <ParfumDetail
          parfum={selectedParfum}
          onClose={() => setSelectedParfum(null)}
        />
      )}

      <FilterModal show={showFilters} onClose={() => setShowFilters(false)} />
    </div>
  );
};

export default ScentifyApp;
