// components/OptimizedImage.jsx
import React, { useState, useCallback } from "react";

const OptimizedImage = ({
  src,
  alt,
  width = 400,
  height = 600,
  quality = 80,
  format = "webp",
  className = "",
  loading = "lazy",
  fallbackSrc = "https://res.cloudinary.com/dyxmkgpgp/image/upload/v1756928420/parfum-en-bouteille-noire-sur-la-table_ixbh79.jpg",
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Générer URL Cloudinary optimisée
  const optimizeCloudinaryUrl = useCallback(
    (url) => {
      if (!url || !url.includes("cloudinary.com")) return url;

      try {
        const [base, path] = url.split("/upload/");
        if (!base || !path) return url;

        const transformations = [
          `w_${width}`,
          `h_${height}`,
          `c_fill`,
          `f_${format}`,
          `q_${quality}`,
          "dpr_auto",
          "f_auto",
        ].join(",");

        return `${base}/upload/${transformations}/${path}`;
      } catch (error) {
        console.warn("Erreur optimisation Cloudinary:", error);
        return url;
      }
    },
    [width, height, format, quality]
  );

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    if (!hasError && currentSrc !== fallbackSrc) {
      console.warn(`Image failed: ${currentSrc}, using fallback`);
      setCurrentSrc(fallbackSrc);
      setHasError(true);
      setIsLoaded(false);
    } else {
      console.error(`Fallback also failed: ${fallbackSrc}`);
      setHasError(true);
      setIsLoaded(true); // On affiche quand même quelque chose
    }
  }, [currentSrc, fallbackSrc, hasError]);

  const optimizedSrc = optimizeCloudinaryUrl(currentSrc || fallbackSrc);

  return (
    <div
      className={`image-container ${className}`}
      style={{
        position: "relative",
        width: width,
        height: height,
        overflow: "hidden",
        backgroundColor: "#f3f4f6", // Fond gris clair
      }}
    >
      {/* Skeleton loader - toujours visible jusqu'au chargement */}
      {!isLoaded && (
        <div
          className="image-placeholder"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#e5e7eb",
            zIndex: 1,
          }}
        >
          <div
            className="loading-skeleton"
            style={{
              width: "60%",
              height: "60%",
              backgroundColor: "#d1d5db",
              borderRadius: "8px",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
        </div>
      )}

      {/* Image - toujours rendue mais peut être cachée par le placeholder */}
      <img
        src={optimizedSrc}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
          zIndex: 2,
        }}
        {...props}
      />

      {/* Message d'erreur si tout échoue */}
      {hasError && isLoaded && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            fontSize: "14px",
            textAlign: "center",
            zIndex: 3,
          }}
        >
          ⚠️ Image indisponible
        </div>
      )}
    </div>
  );
};

// Ajouter les keyframes CSS pour l'animation pulse
const styleElement = document.createElement("style");
styleElement.textContent = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;
document.head.appendChild(styleElement);

export default OptimizedImage;
