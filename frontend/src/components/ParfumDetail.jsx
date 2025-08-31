// frontend/src/components/ParfumDetail.jsx
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
import styles from "../styles/ParfumDetail.css";

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

  // Helpers classes
  const getGenreClass = (genre) => {
    const g = (genre || "").toLowerCase();
    if (g === "homme") return styles.badgeHomme;
    if (g === "femme") return styles.badgeFemme;
    if (g === "mixte") return styles.badgeMixte;
    return styles.badgeDefault;
  };

  const getNoteTypeClass = (type) => {
    const t = (type || "").toLowerCase();
    if (t === "tête" || t === "tete") return styles.chipHead;
    if (t === "cœur" || t === "coeur") return styles.chipHeart;
    if (t === "fond") return styles.chipBase;
    return styles.chipDefault;
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
    return { prix: lien?.prix ? `${lien.prix}€` : undefined, isPromo: false };
  };

  // Load + historique
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

        const parfumResponse = await parfumAPI.getById(id);
        const parfumData = parfumResponse.data;
        setParfum(parfumData);

        if (isAuthenticated) {
          try {
            await historyAPI.addToHistory(id);
            window.dispatchEvent(
              new CustomEvent("historyUpdated", {
                detail: { parfum: parfumData },
              })
            );
          } catch (e) {
            console.warn("Historique non bloquant:", e?.message || e);
          }
        }

        try {
          const similarResponse = await parfumAPI.getSimilar(id);
          setSimilarParfums(similarResponse.data || []);
        } catch {
          setSimilarParfums([]);
        }
      } catch (err) {
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

  // Sync favoris
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

  // Favoris
  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour ajouter des favoris");
      navigate("/auth");
      return;
    }
    if (!parfum?._id || favoriteLoading) return;

    setFavoriteLoading(true);
    const prev = isFavorite;
    setIsFavorite(!isFavorite);

    try {
      if (prev) {
        await favoriAPI.removeParfum(parfum._id);
        toast.success(`${parfum.nom} retiré des favoris`);
      } else {
        await favoriAPI.addParfum(parfum._id);
        toast.success(`${parfum.nom} ajouté aux favoris !`);
      }
      window.dispatchEvent(
        new CustomEvent("favorisUpdated", {
          detail: { parfumId: parfum._id, action: prev ? "remove" : "add" },
        })
      );
    } catch (err) {
      setIsFavorite(prev);
      if (err?.response?.status === 401) {
        toast.error("Session expirée, reconnectez-vous");
        navigate("/auth");
      } else {
        toast.error(
          err?.response?.data?.message || "Erreur lors de la modification"
        );
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Partage
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié dans le presse-papiers");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };
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
        if (err?.name !== "AbortError") copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  if (loading) {
    return (
      <div className={styles.fullPageCenter}>
        <div className={styles.loaderCard}>
          <div className={styles.spinner} />
          <p className={styles.muted}>Chargement du parfum...</p>
        </div>
      </div>
    );
  }

  if (error || !parfum) {
    return (
      <div className={styles.fullPageCenter}>
        <div className={styles.errorCard}>
          <Eye className={styles.errorIcon} />
          <h2 className={styles.errorTitle}>{error || "Parfum non trouvé"}</h2>
          <p className={styles.muted}>
            Ce parfum n'existe pas ou a été supprimé.
          </p>
          <div className={styles.errorActions}>
            <button onClick={() => navigate(-1)} className={styles.btnGhost}>
              <ArrowLeft className={styles.icon} />
              Retour
            </button>
            <button onClick={() => navigate("/")} className={styles.btnPrimary}>
              Accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button className={styles.back} onClick={() => navigate(-1)}>
            <ArrowLeft className={styles.icon} />
            <span>Retour</span>
          </button>
          <div className={styles.headerActions}>
            <button
              className={styles.iconButton}
              onClick={handleShare}
              title="Partager"
            >
              <Share2 className={styles.icon} />
            </button>
            <button
              className={`${styles.iconButton} ${
                isFavorite ? styles.favActive : ""
              } ${favoriteLoading ? styles.disabled : ""}`}
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Heart
                className={styles.icon}
                {...(isFavorite ? { fill: "currentColor" } : {})}
              />
            </button>
          </div>
        </div>
      </header>

      <main className={styles.container}>
        {/* Grille principale */}
        <section className={styles.grid}>
          {/* Colonne image */}
          <div className={styles.left}>
            <article className={styles.photoCard}>
              <img
                className={styles.photo}
                src={
                  parfum.photo ||
                  "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=600&fit=crop"
                }
                alt={parfum.nom}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=600&fit=crop";
                }}
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

            <div className={styles.tiles}>
              <div className={styles.tile}>
                <div className={styles.tileLabel}>Marque</div>
                <div className={styles.tileValue}>{parfum.marque}</div>
              </div>
              <div className={styles.tile}>
                <div className={styles.tileLabel}>Genre</div>
                <div className={`${styles.tileValue} ${styles.cap}`}>
                  {parfum.genre}
                </div>
              </div>
            </div>
          </div>

          {/* Colonne contenu */}
          <div className={styles.right}>
            <header className={styles.titleBlock}>
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

            {/* Notes */}
            {parfum.notes?.length > 0 && (
              <section className={styles.card}>
                <div className={styles.sectionHead}>
                  <Sparkles className={`${styles.icon} ${styles.primary}`} />
                  <h2 className={styles.sectionTitle}>Notes olfactives</h2>
                </div>

                <div className={styles.notes}>
                  {["tête", "cœur", "fond"].map((type) => {
                    const notes = parfum.notes.filter((n) => n.type === type);
                    if (!notes.length) return null;
                    return (
                      <div key={type} className={styles.noteGroup}>
                        <h3 className={styles.noteTitle}>Notes de {type}</h3>
                        <div className={styles.badges}>
                          {notes.map((n, i) => (
                            <span
                              key={n._id || i}
                              className={`${styles.chip} ${getNoteTypeClass(
                                type
                              )}`}
                            >
                              {n.nom}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Marchands */}
            {parfum.liensMarchands?.length > 0 && (
              <section className={styles.card}>
                <div className={styles.sectionHead}>
                  <ShoppingBag className={`${styles.icon} ${styles.success}`} />
                  <h2 className={styles.sectionTitle}>Où l'acheter</h2>
                  {parfum.meilleurPrix && (
                    <span className={styles.bestPrice}>
                      À partir de {parfum.meilleurPrix}€
                    </span>
                  )}
                </div>

                <div className={styles.merchants}>
                  {parfum.liensMarchands
                    .filter((l) => l?.disponible !== false)
                    .map((m, idx) => {
                      const prix = formatPrix(m);
                      return (
                        <div key={idx} className={styles.merchantRow}>
                          <div className={styles.merchantLeft}>
                            <div className={styles.merchantLogo}>
                              <ShoppingBag className={styles.iconInverse} />
                            </div>
                            <div>
                              <div className={styles.merchantTitleLine}>
                                <span className={styles.merchantName}>
                                  {m?.nom || m?.site || "Boutique"}
                                </span>
                                {m?.label && (
                                  <span className={styles.merchantTag}>
                                    {m.label}
                                  </span>
                                )}
                              </div>
                              {m?.format && (
                                <div className={styles.merchantMeta}>
                                  <Tag className={styles.iconMuted} />
                                  {m.format}
                                </div>
                              )}
                              {m?.delaiLivraison && (
                                <div className={styles.merchantMeta}>
                                  <Truck className={styles.iconMuted} />
                                  {m.delaiLivraison}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className={styles.merchantRight}>
                            {prix?.isPromo ? (
                              <div className={styles.priceBlock}>
                                <div className={styles.priceNow}>
                                  {prix.prix}
                                </div>
                                <div className={styles.priceWas}>
                                  {prix.prixOriginal}
                                </div>
                                <div className={styles.priceDiscount}>
                                  -{prix.reduction}
                                </div>
                              </div>
                            ) : (
                              <div className={styles.priceBlock}>
                                {prix?.prix ? (
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

                            {m?.url && (
                              <a
                                href={m.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className={styles.offer}
                              >
                                Voir l'offre{" "}
                                <ExternalLink className={styles.iconInverse} />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                <p className={styles.disclaimer}>
                  <Clock className={styles.iconMuted} />
                  Les prix et disponibilités sont indicatifs et peuvent varier
                  selon les boutiques.
                </p>
              </section>
            )}
          </div>
        </section>

        {/* Similaires */}
        <section className={styles.similar}>
          <div className={styles.sectionHeadAlt}>
            <Sparkles className={`${styles.icon} ${styles.purple}`} />
            <h2 className={styles.sectionTitle}>Parfums similaires</h2>
          </div>

          {similarParfums?.length ? (
            <div className={styles.similarGrid}>
              {similarParfums.map((p) => (
                <ParfumCard key={p._id} parfum={p} />
              ))}
            </div>
          ) : (
            <div className={styles.emptySimilar}>
              Aucun parfum similaire trouvé pour le moment.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
