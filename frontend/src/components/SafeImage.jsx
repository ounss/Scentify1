// frontend/src/components/SafeImage.jsx
import React, { useState, useCallback } from "react";

const DEFAULT_PARFUM_IMAGE =
  "https://fr.freepik.com/photos-gratuite/parfum-dans-bouteille-noire-table_7359606.htm#fromView=search&page=1&position=49&uuid=76213cf2-d227-4114-83e8-c9e3400fb27f&query=parfum";

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
