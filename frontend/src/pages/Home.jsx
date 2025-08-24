import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Sparkles, TrendingUp } from 'lucide-react';
import { parfumAPI } from '../services/api';
import ParfumCard from '../components/parfum/ParfumCard';
import ParfumFilters from '../components/parfum/ParfumFilters';
import toast from 'react-hot-toast';

export default function Home() {
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    genre: 'tous',
    sortBy: 'popularite'
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Charger les parfums
  const loadParfums = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchParams.get('search') || '',
        genre: filters.genre !== 'tous' ? filters.genre : '',
        sortBy: filters.sortBy,
        page: 1,
        limit: 24
      };
      
      const response = await parfumAPI.getAll(params);
      setParfums(response.data.parfums || []);
    } catch (error) {
      console.error('Erreur chargement parfums:', error);
      toast.error('Erreur lors du chargement des parfums');
      setParfums([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParfums();
  }, [searchParams, filters]);

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) setSearchQuery(search);
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  const categories = [
    { 
      label: 'Tendances', 
      icon: TrendingUp,
      onClick: () => setFilters({ ...filters, sortBy: 'popularite' }),
      gradient: 'from-pink-500 to-rose-500'
    },
    { 
      label: 'Homme', 
      icon: Sparkles,
      onClick: () => setFilters({ ...filters, genre: 'homme' }),
      gradient: 'from-blue-500 to-indigo-500'
    },
    { 
      label: 'Femme', 
      icon: Sparkles,
      onClick: () => setFilters({ ...filters, genre: 'femme' }),
      gradient: 'from-pink-500 to-purple-500'
    },
    { 
      label: 'Mixte', 
      icon: Sparkles,
      onClick: () => setFilters({ ...filters, genre: 'mixte' }),
      gradient: 'from-green-500 to-teal-500'
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 py-20">
        <div className="absolute inset-0 bg-white/20 backdrop-blur-3xl"></div>
        <div className="relative container mx-auto px-4 text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6">
              Votre parfum idéal vous attend
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Découvrez des fragrances uniques grâce à notre intelligence olfactive. 
              Recherchez par notes, explorez par affinités.
            </p>
          </div>
          
          {/* Barre de recherche principale */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-12">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-red-500 transition-colors" />
              <input
                type="text"
                placeholder="Recherchez un parfum, une marque ou une note olfactive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-20 py-5 text-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/20 shadow-2xl transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="absolute right-6 top-1/2 transform -translate-y-1/2 p-2 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Filter className="w-6 h-6 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          </form>

          {/* Catégories animées */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={category.onClick}
                className={`group relative overflow-hidden bg-gradient-to-r ${category.gradient} p-6 rounded-2xl text-white font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <category.icon className="w-5 h-5" />
                  <span>{category.label}</span>
                </div>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-12">
        {/* En-tête résultats */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              {searchParams.get('search') ? 
                `Résultats pour "${searchParams.get('search')}"` : 
                'Parfums populaires'
              }
            </h2>
            <p className="text-gray-600 mt-2">
              {parfums.length} parfum{parfums.length > 1 ? 's' : ''} 
              {loading ? ' en cours de chargement...' : ' disponible' + (parfums.length > 1 ? 's' : '')}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select 
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="popularite">Plus populaires</option>
              <option value="nom">Nom A-Z</option>
              <option value="marque">Marque A-Z</option>
              <option value="recent">Plus récents</option>
            </select>
            
            <button
              onClick={() => setShowFilters(true)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filtres</span>
            </button>
          </div>
        </div>

        {/* Grille de parfums */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-lg animate-pulse">
                <div className="bg-gray-200 h-64"></div>
                <div className="p-6">
                  <div className="bg-gray-200 h-6 rounded mb-3"></div>
                  <div className="bg-gray-200 h-4 rounded w-2/3 mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="bg-gray-200 h-6 w-16 rounded-full"></div>
                    <div className="bg-gray-200 h-6 w-16 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : parfums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {parfums.map(parfum => (
              <ParfumCard key={parfum._id} parfum={parfum} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-white rounded-3xl p-12 shadow-lg max-w-md mx-auto">
              <Search className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                Aucun parfum trouvé
              </h3>
              <p className="text-gray-500 mb-6">
                Essayez de modifier vos critères de recherche ou explorez nos catégories
              </p>
              <button
                onClick={() => {
                  setSearchParams({});
                  setSearchQuery('');
                  setFilters({ genre: 'tous', sortBy: 'popularite' });
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Voir tous les parfums
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Filtres */}
      <ParfumFilters 
        show={showFilters}
        filters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setShowFilters(false);
        }}
        onClose={() => setShowFilters(false)}
      />
    </div>
  );
}import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Star } from 'lucide-react';
import { parfumService } from '../services/api';
import ParfumCard from '../components/parfum/ParfumCard';
import ParfumFilters from '../components/parfum/ParfumFilters';

export default function Home() {
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    genre: 'tous',
    sortBy: 'popularite'
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Charger les parfums
  const loadParfums = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchParams.get('search') || '',
        genre: filters.genre !== 'tous' ? filters.genre : '',
        sortBy: filters.sortBy,
        page: 1,
        limit: 20
      };
      
      const response = await parfumService.getAll(params);
      setParfums(response.data.parfums || []);
    } catch (error) {
      console.error('Erreur chargement parfums:', error);
      setParfums([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParfums();
  }, [searchParams, filters]);

  // Initialiser searchQuery depuis l'URL
  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const categories = [
    { label: 'Populaires', onClick: () => setFilters({ ...filters, sortBy: 'popularite' }) },
    { label: 'Homme', onClick: () => setFilters({ ...filters, genre: 'homme' }) },
    { label: 'Femme', onClick: () => setFilters({ ...filters, genre: 'femme' }) },
    { label: 'Mixte', onClick: () => setFilters({ ...filters, genre: 'mixte' }) },
    { label: 'Récents', onClick: () => setFilters({ ...filters, sortBy: 'recent' }) },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-100 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Découvrez votre parfum idéal
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Explorez notre collection de parfums et trouvez celui qui vous correspond 
            grâce à nos recommandations basées sur les notes olfactives
          </p>
          
          {/* Barre de recherche principale */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un parfum, une marque ou une note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-16 py-4 text-lg border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Filter className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Catégories rapides */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Catégories populaires</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={category.onClick}
                className="px-4 py-2 bg-white text-gray-700 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm"
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Résultats */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {searchParams.get('search') ? 
              `Résultats pour "${searchParams.get('search')}"` : 
              'Parfums populaires'
            }
          </h2>
          <p className="text-gray-600">
            {parfums.length} parfum{parfums.length > 1 ? 's' : ''} trouvé{parfums.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Grille de parfums */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-3 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : parfums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {parfums.map(parfum => (
              <ParfumCard key={parfum._id} parfum={parfum} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Aucun parfum trouvé
            </h3>
            <p className="text-gray-500">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        )}
      </div>

      {/* Modal Filtres */}
      <ParfumFilters 
        show={showFilters}
        filters={filters}
        onApply={applyFilters}
        onClose={() => setShowFilters(false)}
      />
    </div>
  );
}