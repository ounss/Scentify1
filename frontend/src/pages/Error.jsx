import React from "react";

const Error = () => {
  const styles = `
    .error-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f1e0cc 0%, #ffffff 50%, #f9fafb 100%);
      font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #2c2c2c;
    }

    .error-card {
      text-align: center;
      max-width: 600px;
      padding: 60px 40px;
      background: #ffffff;
      border-radius: 2rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      position: relative;
      overflow: hidden;
      margin: 20px;
    }

    .decorative-elements {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      border-radius: 2rem;
    }

    .floating-scent {
      position: absolute;
      background: radial-gradient(circle, rgba(185, 164, 141, 0.1), transparent);
      border-radius: 50%;
      animation: floatScent 8s ease-in-out infinite;
    }

    .floating-scent:nth-child(1) {
      width: 60px;
      height: 60px;
      top: 10%;
      left: 10%;
      animation-delay: 0s;
    }

    .floating-scent:nth-child(2) {
      width: 40px;
      height: 40px;
      top: 70%;
      right: 15%;
      animation-delay: 3s;
    }

    .floating-scent:nth-child(3) {
      width: 80px;
      height: 80px;
      bottom: 20%;
      left: 20%;
      animation-delay: 6s;
    }

    @keyframes floatScent {
      0%, 100% {
        transform: translateY(0) scale(1);
        opacity: 0.3;
      }
      50% {
        transform: translateY(-20px) scale(1.1);
        opacity: 0.6;
      }
    }

    .brand-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 40px;
    }

    .perfume-icon {
      width: 40px;
      height: 50px;
      background: linear-gradient(135deg, #a44949, #8a3d3d);
      border-radius: 8px 8px 12px 12px;
      position: relative;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .perfume-icon::before {
      content: '';
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 12px;
      height: 12px;
      background: #8a3d3d;
      border-radius: 2px;
    }

    .brand-name {
      font-family: 'Playfair Display', serif;
      font-size: 1.8rem;
      font-weight: 400;
      color: #2c2c2c;
      letter-spacing: 2px;
    }

    .error-code {
      font-family: 'Playfair Display', serif;
      font-size: 6rem;
      font-weight: 400;
      margin-bottom: 20px;
      color: #a44949;
      animation: gentleGlow 3s ease-in-out infinite alternate;
    }

    @keyframes gentleGlow {
      from {
        opacity: 0.8;
        transform: scale(1);
      }
      to {
        opacity: 1;
        transform: scale(1.02);
      }
    }

    .error-title {
      font-family: 'Playfair Display', serif;
      font-size: 2.2rem;
      margin-bottom: 20px;
      font-weight: 400;
      color: #2c2c2c;
    }

    .error-message {
      font-family: 'Nunito Sans', sans-serif;
      font-size: 1.1rem;
      margin-bottom: 40px;
      line-height: 1.7;
      color: #5a5a5a;
      max-width: 480px;
      margin-left: auto;
      margin-right: auto;
    }

    .construction-section {
      margin-bottom: 40px;
    }

    .construction-icon {
      font-size: 3rem;
      margin-bottom: 20px;
      animation: softFloat 3s ease-in-out infinite;
      opacity: 0.7;
    }

    @keyframes softFloat {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-8px);
      }
    }

    .progress-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 30px 0;
    }

    .progress-dot {
      width: 8px;
      height: 8px;
      background: #a44949;
      border-radius: 50%;
      animation: progressPulse 1.5s ease-in-out infinite;
    }

    .progress-dot:nth-child(2) {
      animation-delay: 0.3s;
    }

    .progress-dot:nth-child(3) {
      animation-delay: 0.6s;
    }

    @keyframes progressPulse {
      0%, 100% {
        opacity: 0.3;
        transform: scale(1);
      }
      50% {
        opacity: 1;
        transform: scale(1.2);
      }
    }

    .home-button {
      display: inline-block;
      padding: 16px 32px;
      background: #a44949;
      color: #ffffff;
      text-decoration: none;
      border-radius: 1rem;
      font-family: 'Nunito Sans', sans-serif;
      font-size: 1rem;
      font-weight: 500;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .home-button:hover {
      background: #8a3d3d;
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .fade-in {
      animation: fadeIn 0.8s ease forwards;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .error-card {
        padding: 40px 30px;
      }

      .error-code {
        font-size: 4rem;
      }
      
      .error-title {
        font-size: 1.8rem;
      }
      
      .error-message {
        font-size: 1rem;
      }

      .brand-name {
        font-size: 1.5rem;
      }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="error-container">
        <div className="error-card fade-in">
          <div className="decorative-elements">
            <div className="floating-scent"></div>
            <div className="floating-scent"></div>
            <div className="floating-scent"></div>
          </div>

          <div className="brand-header">
            <div className="perfume-icon"></div>
            <div className="brand-name">SCENTIFY</div>
          </div>

          <div className="error-code">404</div>
          <h1 className="error-title">Page en cours de développement</h1>

          <p className="error-message">
            Nous créons actuellement une nouvelle expérience olfactive pour
            cette section. Notre équipe travaille avec passion pour vous offrir
            les meilleures recommandations parfumées. Cette page sera bientôt
            disponible.
          </p>

          <div className="construction-section">
            <div className="construction-icon">🌸</div>
            <div className="progress-indicator">
              <div className="progress-dot"></div>
              <div className="progress-dot"></div>
              <div className="progress-dot"></div>
            </div>
          </div>

          <a href="/" className="home-button">
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </>
  );
};

export default Error;
