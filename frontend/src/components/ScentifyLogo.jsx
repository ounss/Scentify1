// frontend/src/components/ScentifyLogo.jsx
import React from "react";

const ScentifyLogo = ({ size = 40, className = "" }) => (
  <div className={`inline-flex items-center justify-center ${className}`}>
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 100 120"
      fill="none"
      className="text-current"
    >
      {/* Flacon de parfum principal */}
      <path
        d="M25 45 Q25 40 30 40 L70 40 Q75 40 75 45 L75 95 Q75 100 70 100 L30 100 Q25 100 25 95 Z"
        fill="currentColor"
        opacity="0.9"
      />

      {/* Bouchon du parfum */}
      <rect x="40" y="25" width="20" height="18" rx="3" fill="currentColor" />

      {/* Vaporisateur */}
      <rect x="46" y="18" width="8" height="10" rx="2" fill="currentColor" />

      {/* Étiquette/reflet sur le flacon */}
      <rect
        x="35"
        y="55"
        width="30"
        height="25"
        rx="6"
        fill="rgba(255,255,255,0.2)"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
      />

      {/* Détails décoratifs */}
      <circle cx="50" cy="67" r="3" fill="rgba(255,255,255,0.3)" />
    </svg>
  </div>
);

export default ScentifyLogo;
