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
  loading = "eager", // EAGER par défaut pour affichage immédiat
  fallbackSrc = "https://res.cloudinary.com/dyxmkgpgp/image/upload/v1756928420/parfum-en-bouteille-noire-sur-la-table_ixbh79.jpg",
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

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

  const handleError = useCallback(() => {
    if (!hasError && currentSrc !== fallbackSrc) {
      console.warn(`Image failed: ${currentSrc}, using fallback`);
      setCurrentSrc(fallbackSrc);
      setHasError(true);
    }
  }, [currentSrc, fallbackSrc, hasError]);

  const optimizedSrc = optimizeCloudinaryUrl(currentSrc || fallbackSrc);

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      loading={loading}
      onError={handleError}
      className={className}
      style={{
        width: width,
        height: height,
        objectFit: "cover",
        backgroundColor: "#f3f4f6", // Fond pendant le chargement
        ...props.style,
      }}
      {...props}
    />
  );
};

export default OptimizedImage;
