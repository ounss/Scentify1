// frontend/src/components/SafeImage.jsx
import React, { useState, useCallback } from "react";

const DEFAULT_PARFUM_IMAGE =
  "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&h=800&fit=crop&auto=format";

export default function SafeImage({
  src,
  alt = "Image",
  className = "",
  fallbackSrc = DEFAULT_PARFUM_IMAGE,
  loading = "lazy",
  ...props
}) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const [hasErrored, setHasErrored] = useState(false);

  const handleError = useCallback(
    (e) => {
      if (!hasErrored && currentSrc !== fallbackSrc) {
        console.warn(`Image failed: ${currentSrc}, using fallback`);
        setCurrentSrc(fallbackSrc);
        setHasErrored(true);
      } else if (hasErrored) {
        console.error(`Fallback also failed: ${fallbackSrc}`);
        e.target.style.display = "none";
      }
    },
    [currentSrc, fallbackSrc, hasErrored]
  );

  const handleLoad = useCallback(() => {
    if (hasErrored) {
      setHasErrored(false);
    }
  }, [hasErrored]);

  const imageSrc =
    src && typeof src === "string" && src.trim() !== ""
      ? currentSrc
      : fallbackSrc;

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  );
}
