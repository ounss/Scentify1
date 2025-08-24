import { useState, useEffect } from "react";
import { parfumsAPI, notesAPI, favoritesAPI } from "../services/api";

// Hook pour récupérer les parfums avec filtres
export const useParfums = (filters = {}) => {
  const [parfums, setParfums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const fetchParfums = async () => {
      try {
        setLoading(true);
        const response = await parfumsAPI.getAll(filters);
        setParfums(response.data.parfums || response.data);
        setPagination(response.data.pagination);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Erreur lors du chargement");
        setParfums([]);
      } finally {
        setLoading(false);
      }
    };

    fetchParfums();
  }, [JSON.stringify(filters)]);

  return { parfums, loading, error, pagination, setParfums };
};

// Hook pour un parfum spécifique
export const useParfum = (id) => {
  const [parfum, setParfum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchParfum = async () => {
      try {
        setLoading(true);
        const response = await parfumsAPI.getById(id);
        setParfum(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Parfum non trouvé");
        setParfum(null);
      } finally {
        setLoading(false);
      }
    };

    fetchParfum();
  }, [id]);

  return { parfum, loading, error, setParfum };
};

// Hook pour les notes olfactives
export const useNotes = (filters = {}) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const response = await notesAPI.getAll(filters);
        setNotes(response.data.notes || response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Erreur lors du chargement");
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [JSON.stringify(filters)]);

  return { notes, loading, error, setNotes };
};

// Hook pour la recherche avec debounce
export const useSearch = (initialQuery = "") => {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce de la query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Recherche quand debouncedQuery change
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const search = async () => {
      try {
        setLoading(true);
        const response = await parfumsAPI.search(debouncedQuery);
        setResults(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Erreur de recherche");
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedQuery]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearResults: () => setResults([]),
  };
};

// Hook pour les favoris
export const useFavorites = () => {
  const [favorites, setFavorites] = useState({ parfums: [], notes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await favoritesAPI.getFavorites();
      setFavorites(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du chargement");
      setFavorites({ parfums: [], notes: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const toggleParfumFavorite = async (parfumId) => {
    try {
      const isAlreadyFavorite = favorites.parfums.some(
        (p) => p._id === parfumId
      );

      if (isAlreadyFavorite) {
        await favoritesAPI.removeParfum(parfumId);
        setFavorites((prev) => ({
          ...prev,
          parfums: prev.parfums.filter((p) => p._id !== parfumId),
        }));
      } else {
        await favoritesAPI.addParfum(parfumId);
        await fetchFavorites(); // Recharger pour avoir les données complètes
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur favoris");
    }
  };

  const toggleNoteFavorite = async (noteId) => {
    try {
      const isAlreadyFavorite = favorites.notes.some((n) => n._id === noteId);

      if (isAlreadyFavorite) {
        await favoritesAPI.removeNote(noteId);
        setFavorites((prev) => ({
          ...prev,
          notes: prev.notes.filter((n) => n._id !== noteId),
        }));
      } else {
        await favoritesAPI.addNote(noteId);
        await fetchFavorites();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur favoris");
    }
  };

  return {
    favorites,
    loading,
    error,
    toggleParfumFavorite,
    toggleNoteFavorite,
    refetch: fetchFavorites,
  };
};

// Hook pour gérer les états de chargement et erreurs
export const useAsync = (asyncFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const execute = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await asyncFunction();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    execute();

    return () => {
      cancelled = true;
    };
  }, dependencies);

  return { data, loading, error, setData };
};

export default {
  useParfums,
  useParfum,
  useNotes,
  useSearch,
  useFavorites,
  useAsync,
};
