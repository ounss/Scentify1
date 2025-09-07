// components/OptimizedImage.jsx
import React, { useState } from "react";

const OptimizedImage = ({
  src,
  alt,
  width = 400,
  height = 300,
  quality = 80,
  format = "webp",
  className = "",
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Générer URL Cloudinary optimisée
  const optimizeCloudinaryUrl = (url) => {
    if (!url || !url.includes("cloudinary.com")) return url;

    const [base, path] = url.split("/upload/");
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
  };

  const optimizedSrc = optimizeCloudinaryUrl(src);

  return (
    <div className={`image-container ${className}`}>
      {!isLoaded && (
        <div className="image-placeholder" style={{ width, height }}>
          <div className="loading-skeleton" />
        </div>
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        style={{ display: isLoaded ? "block" : "none" }}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
