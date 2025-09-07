import React from "react";

const Error = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, #f1e0cc 0%, #ffffff 50%, #f9fafb 100%)",
        fontFamily:
          '"Nunito Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div className="text-center max-w-2xl mx-4 p-16 bg-white rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Éléments décoratifs flottants */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <div
            className="absolute w-16 h-16 rounded-full animate-pulse"
            style={{
              background:
                "radial-gradient(circle, rgba(185, 164, 141, 0.1), transparent)",
              top: "10%",
              left: "10%",
              animationDelay: "0s",
              animationDuration: "8s",
            }}
          />
          <div
            className="absolute w-10 h-10 rounded-full animate-pulse"
            style={{
              background:
                "radial-gradient(circle, rgba(185, 164, 141, 0.1), transparent)",
              top: "70%",
              right: "15%",
              animationDelay: "3s",
              animationDuration: "8s",
            }}
          />
          <div
            className="absolute w-20 h-20 rounded-full animate-pulse"
            style={{
              background:
                "radial-gradient(circle, rgba(185, 164, 141, 0.1), transparent)",
              bottom: "20%",
              left: "20%",
              animationDelay: "6s",
              animationDuration: "8s",
            }}
          />
        </div>

        {/* Header avec logo Scentify */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div
            className="w-10 h-12 rounded-lg relative shadow-lg"
            style={{
              background: "linear-gradient(135deg, #a44949, #8a3d3d)",
              borderRadius: "8px 8px 12px 12px",
            }}
          >
            <div
              className="absolute w-3 h-3 rounded-sm"
              style={{
                background: "#8a3d3d",
                top: "-8px",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />
          </div>
          <h2
            className="text-3xl font-normal tracking-widest"
            style={{
              fontFamily: '"Playfair Display", serif',
              color: "#2c2c2c",
              letterSpacing: "2px",
            }}
          >
            SCENTIFY
          </h2>
        </div>

        {/* Code d'erreur 404 */}
        <div
          className="text-8xl font-normal mb-5 animate-pulse"
          style={{
            fontFamily: '"Playfair Display", serif',
            color: "#a44949",
            animationDuration: "3s",
          }}
        >
          404
        </div>

        {/* Titre */}
        <h1
          className="text-4xl font-normal mb-5"
          style={{
            fontFamily: '"Playfair Display", serif',
            color: "#2c2c2c",
          }}
        >
          Page en cours de développement
        </h1>

        {/* Message */}
        <p
          className="text-lg leading-relaxed mb-10 max-w-lg mx-auto"
          style={{
            fontFamily: '"Nunito Sans", sans-serif',
            color: "#5a5a5a",
          }}
        >
          Nous créons actuellement une nouvelle expérience olfactive pour cette
          section. Notre équipe travaille avec passion pour vous offrir les
          meilleures recommandations parfumées. Cette page sera bientôt
          disponible.
        </p>

        {/* Section construction */}
        <div className="mb-10">
          <div
            className="text-5xl mb-5 animate-bounce"
            style={{
              animationDuration: "3s",
              opacity: 0.7,
            }}
          >
            🌸
          </div>

          {/* Indicateur de progression */}
          <div className="flex items-center justify-center gap-2 my-8">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full animate-pulse"
                style={{
                  background: "#a44949",
                  animationDelay: `${index * 0.3}s`,
                  animationDuration: "1.5s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Bouton retour */}
        <a
          href="/"
          className="inline-block px-8 py-4 text-white font-medium rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
          style={{
            background: "#a44949",
            fontFamily: '"Nunito Sans", sans-serif',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#8a3d3d";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "#a44949";
          }}
        >
          ← Retour à l'accueil
        </a>
      </div>
    </div>
  );
};

export default Error;
