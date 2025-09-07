// frontend/src/components/ParfumDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Star,
  Share2,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { parfumAPI, favoritesAPI, historyAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import ParfumCard from "./ParfumCard";
import toast from "react-hot-toast";
import OptimizedImage from "./OptimizedImage";
import styles from "../styles/ParfumDetail.module.css";

export default function ParfumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [parfum, setParfum] = useState(null);
  const [similarParfums, setSimilarParfums] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // 🔧 FIX: Forcer le scroll en haut à chaque changement d'ID (robuste)
  useEffect(() => {
    const originalBodyPaddingTop = document.body.style.paddingTop;
    document.body.style.paddingTop = "0";

    // Scroll immédiat
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    // Scroll après rendu (gère sticky headers / offsets)
    const timeoutId = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      document.body.style.paddingTop = originalBodyPaddingTop;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.body.style.paddingTop = originalBodyPaddingTop;
    };
  }, [id]);

  // Charger les données du parfum
  useEffect(() => {
    loadParfumData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Ajouter à l'historique si utilisateur connecté
  useEffect(() => {
    if (parfum && isAuthenticated) {
      addToHistory();
    }
  }, [parfum, isAuthenticated]);

  const loadParfumData = async () => {
    if (!id) {
      setError("ID de parfum manquant");
      setLoading(false);
      setSimilarLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSimilarLoading(true);

      // 1) Charger le parfum principal
      const parfumResponse = await parfumAPI.getById(id);
      if (!parfumResponse?.data) {
        throw new Error("Parfum non trouvé");
      }
      setParfum(parfumResponse.data);
      setLoading(false);

      // 2) 🔧 FIX: Charger les parfums similaires avec l'endpoint correct
      try {
        // ✅ CORRECTION: Utiliser l'URL correcte qui correspond à la route backend
        const similarResponse = await parfumAPI.getSimilar(id);

        let similarData = [];
        if (similarResponse?.data) {
          // Backend retourne directement un tableau de parfums similaires
          if (Array.isArray(similarResponse.data)) {
            similarData = similarResponse.data;
          } else if (Array.isArray(similarResponse.data.parfums)) {
            similarData = similarResponse.data.parfums;
          }
        }

        console.log("🔍 Parfums similaires reçus:", similarData);
        setSimilarParfums(similarData || []);
      } catch (similarError) {
        console.warn("Erreur chargement parfums similaires:", similarError);
        setSimilarParfums([]);
      } finally {
        setSimilarLoading(false);
      }

      // 3) Vérifier si en favoris (conserve favoritesAPI)
      if (isAuthenticated) {
        try {
          const favoritesResponse = await favoritesAPI.getFavorites();
          // Tolérant: tableau d'objets avec { parfum: {...} } ou directement {_id}
          const list = Array.isArray(favoritesResponse?.data)
            ? favoritesResponse.data
            : Array.isArray(favoritesResponse?.data?.parfums)
            ? favoritesResponse.data.parfums
            : [];

          const isInFavorites = list.some((fav) => {
            const favId =
              fav?.parfum?._id ?? // cas { parfum: {_id} }
              fav?._id; // cas {_id} direct
            return favId === id;
          });

          setIsFavorite(isInFavorites);
        } catch (favErr) {
          console.warn("Erreur lors de la vérification des favoris:", favErr);
        }
      }
    } catch (err) {
      console.error("Erreur lors du chargement:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Erreur lors du chargement du parfum"
      );
      setLoading(false);
      setSimilarLoading(false);
    }
  };

  const addToHistory = async () => {
    try {
      await historyAPI.addToHistory(parfum._id);
    } catch (error) {
      console.warn("Erreur ajout historique:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour ajouter aux favoris");
      return;
    }

    try {
      setFavoriteLoading(true);

      if (isFavorite) {
        await favoritesAPI.removeFavoriteParfum(parfum._id);
        setIsFavorite(false);
        toast.success("Retiré des favoris");
      } else {
        await favoritesAPI.addFavoriteParfum(parfum._id);
        setIsFavorite(true);
        toast.success("Ajouté aux favoris");
      }
    } catch (error) {
      console.error("Erreur favoris:", error);
      toast.error(error.response?.data?.message || "Erreur lors de l'action");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${parfum.nom} - ${parfum.marque}`,
      text: parfum.description || `Découvrez ${parfum.nom} de ${parfum.marque}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Lien copié dans le presse-papier");
      }
    } catch (error) {
      console.warn("Erreur partage:", error);
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Lien copié dans le presse-papier");
      } catch (clipboardError) {
        toast.error("Impossible de partager");
      }
    }
  };

  // Helpers pour les classes CSS
  const getGenreClass = (genre) => {
    const g = (genre || "").toLowerCase();
    switch (g) {
      case "homme":
        return styles.badgeHomme;
      case "femme":
        return styles.badgeFemme;
      case "mixte":
        return styles.badgeMixte;
      default:
        return styles.badgeDefault;
    }
  };

  const getNoteTypeClass = (type) => {
    const t = (type || "").toLowerCase();
    switch (t) {
      case "tête":
      case "tete":
        return {
          groupClass: styles.noteGroupHead,
          typeClass: styles.noteTypeHead,
          chipClass: styles.chipHead,
        };
      case "cœur":
      case "coeur":
        return {
          groupClass: styles.noteGroupHeart,
          typeClass: styles.noteTypeHeart,
          chipClass: styles.chipHeart,
        };
      case "fond":
        return {
          groupClass: styles.noteGroupBase,
          typeClass: styles.noteTypeBase,
          chipClass: styles.chipBase,
        };
      default:
        return {
          groupClass: "",
          typeClass: "",
          chipClass: styles.chipDefault,
        };
    }
  };

  const formatPrix = (lien) => {
    if (!lien?.prix && !lien?.prixOriginal) return null;

    if (lien?.enPromotion && lien?.prixOriginal && lien?.prix) {
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
      prix: lien?.prix ? `${lien.prix}€` : null,
      isPromo: false,
    };
  };

  // States de chargement et d'erreur
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>Erreur</h2>
            <p>{error}</p>
            <button onClick={() => navigate(-1)} className={styles.offer}>
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!parfum) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>Parfum non trouvé</h2>
            <p>Le parfum demandé n'existe pas ou n'est plus disponible.</p>
            <button onClick={() => navigate("/")} className={styles.offer}>
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header sticky */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button
            onClick={() => navigate(-1)}
            className={styles.back}
            aria-label="Retour à la page précédente"
          >
            <ArrowLeft className={styles.icon} />
            Retour
          </button>

          <div className={styles.headerActions}>
            <button
              onClick={handleShare}
              className={styles.iconButton}
              aria-label="Partager ce parfum"
            >
              <Share2 className={styles.icon} />
            </button>

            {isAuthenticated && (
              <button
                className={`${styles.iconButton} ${
                  isFavorite ? styles.favActive : ""
                } ${favoriteLoading ? styles.disabled : ""}`}
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                aria-label={
                  isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
                }
              >
                <Heart
                  className={styles.icon}
                  fill={isFavorite ? "currentColor" : "none"}
                />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={styles.container}>
        {/* Grille principale */}
        <section className={styles.grid}>
          {/* Colonne image */}
          <div className={styles.left}>
            <article className={styles.photoCard}>
              <OptimizedImage
                src={parfum.photo}
                alt={parfum.nom}
                className={styles.photo}
                width={400}
                height={600}
              loading="eager"
              fallbackSrc="https://res.cloudinary.com/dyxmkgpgp/image/upload/v1756928420/parfum-en-bouteille-noire-sur-la-table_ixbh79.jpg"
              />
              <span
                className={`${styles.badge} ${getGenreClass(parfum.genre)}`}
              >
                {parfum.genre}
              </span>
              {parfum.popularite > 80 && (
                <span className={styles.badgePop}>
                  <Star className={styles.icon} />
                  Populaire
                </span>
              )}
            </article>

            {/* Tuiles d'informations */}
            <div className={styles.tiles}>
              <div className={styles.tile}>
                <div className={styles.tileLabel}>Marque</div>
                <div className={styles.tileValue}>{parfum.marque}</div>
              </div>
              <div className={styles.tile}>
                <div className={styles.tileLabel}>Genre</div>
                <div className={`${styles.tileValue}`}>{parfum.genre}</div>
              </div>
            </div>
          </div>

          {/* Colonne contenu */}
          <div className={styles.right}>
            {/* En-tête titre */}
            <header className={`${styles.titleBlock} ${styles.fadeIn}`}>
              <h1 className={styles.title}>{parfum.nom}</h1>
              <p className={styles.brand}>{parfum.marque}</p>

              {parfum.popularite > 0 && (
                <div className={styles.popRow}>
                  <span className={styles.popScore}>
                    <Star className={`${styles.icon} ${styles.star}`} />
                    <strong>{parfum.popularite}</strong>
                    <span className={styles.muted}>/100</span>
                  </span>
                  <span className={styles.dot}>•</span>
                  <span className={styles.muted}>Note de popularité</span>
                </div>
              )}

              {parfum.description && (
                <p className={styles.description}>{parfum.description}</p>
              )}
            </header>
            {/* Notes olfactives */}
            {(parfum.notes_tete?.length > 0 ||
              parfum.notes_coeur?.length > 0 ||
              parfum.notes_fond?.length > 0) && (
              <section className={`${styles.card} ${styles.slideUp}`}>
                <div className={styles.sectionHead}>
                  <Sparkles className={`${styles.icon} ${styles.primary}`} />
                  <h2 className={styles.sectionTitle}>Notes olfactives</h2>
                </div>

                <div className={styles.notes}>
                  {/* Notes de tête */}
                  {parfum.notes_tete?.length > 0 && (
                    <div
                      className={`${styles.noteGroup} ${styles.noteGroupHead}`}
                    >
                      <h3
                        className={`${styles.noteType} ${styles.noteTypeHead}`}
                      >
                        Notes de tête
                      </h3>
                      <div className={styles.noteChips}>
                        {parfum.notes_tete.map((note, index) => (
                          <span
                            key={`tete-${note._id}-${index}`}
                            className={`${styles.chip} ${styles.chipHead}`}
                          >
                            {note.nom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes de cœur */}
                  {parfum.notes_coeur?.length > 0 && (
                    <div
                      className={`${styles.noteGroup} ${styles.noteGroupHeart}`}
                    >
                      <h3
                        className={`${styles.noteType} ${styles.noteTypeHeart}`}
                      >
                        Notes de cœur
                      </h3>
                      <div className={styles.noteChips}>
                        {parfum.notes_coeur.map((note, index) => (
                          <span
                            key={`coeur-${note._id}-${index}`}
                            className={`${styles.chip} ${styles.chipHeart}`}
                          >
                            {note.nom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes de fond */}
                  {parfum.notes_fond?.length > 0 && (
                    <div
                      className={`${styles.noteGroup} ${styles.noteGroupBase}`}
                    >
                      <h3
                        className={`${styles.noteType} ${styles.noteTypeBase}`}
                      >
                        Notes de fond
                      </h3>
                      <div className={styles.noteChips}>
                        {parfum.notes_fond.map((note, index) => (
                          <span
                            key={`fond-${note._id}-${index}`}
                            className={`${styles.chip} ${styles.chipBase}`}
                          >
                            {note.nom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
            {/* Liens marchands */}
            {parfum.liensMarchands?.length > 0 && (
              <section className={`${styles.card} ${styles.slideUp}`}>
                <div className={styles.sectionHead}>
                  <ExternalLink
                    className={`${styles.icon} ${styles.primary}`}
                  />
                  <h2 className={styles.sectionTitle}>Où acheter</h2>
                </div>

                <div className={styles.merchants}>
                  {parfum.liensMarchands
                    .filter((m) => m?.nom && m?.url)
                    .map((merchant, index) => {
                      const prix = formatPrix(merchant);
                      return (
                        <div
                          key={`${merchant._id || index}`}
                          className={styles.merchant}
                        >
                          <div className={styles.merchantInfo}>
                            <div className={styles.merchantName}>
                              {merchant.nom}
                            </div>

                            {prix && (
                              <div className={styles.priceInfo}>
                                {prix.isPromo ? (
                                  <div className={styles.priceRow}>
                                    <div className={styles.priceNow}>
                                      {prix.prix}
                                    </div>
                                    <div className={styles.priceOriginal}>
                                      {prix.prixOriginal}
                                    </div>
                                    <div className={styles.priceDiscount}>
                                      -{prix.reduction}
                                    </div>
                                  </div>
                                ) : prix.prix ? (
                                  <div className={styles.priceNow}>
                                    {prix.prix}
                                  </div>
                                ) : (
                                  <div className={styles.priceMuted}>
                                    Prix non communiqué
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <a
                            href={merchant.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className={styles.offer}
                            aria-label={`Voir l'offre sur ${merchant.nom}`}
                          >
                            Voir l'offre
                            <ExternalLink className={styles.iconInverse} />
                          </a>
                        </div>
                      );
                    })}
                </div>

                <div className={styles.disclaimer}>
                  <Clock className={styles.iconMuted} />
                  Les prix et disponibilités sont indicatifs et peuvent varier
                  selon les boutiques.
                </div>
              </section>
            )}
          </div>
        </section>

        {/* Parfums similaires */}
        <section className={`${styles.similar} ${styles.slideUp}`}>
          <div className={styles.sectionHeadAlt}>
            <Sparkles className={`${styles.icon} ${styles.purple}`} />
            <h2 className={styles.sectionTitle}>Parfums similaires</h2>
          </div>

          {/* 🔧 FIX: Amélioration de la logique d'affichage des parfums similaires */}
          {similarLoading ? (
            <div className={styles.emptySimilar}>
              <div className={styles.spinner} />
              <p>Recherche de parfums similaires...</p>
            </div>
          ) : similarParfums?.length > 0 ? (
            <div className={styles.similarGrid}>
              {similarParfums.slice(0, 6).map((p) => (
                <ParfumCard key={p._id} parfum={p} />
              ))}
            </div>
          ) : (
            <div className={styles.emptySimilar}>
              <p>Aucun parfum similaire trouvé pour le moment.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
